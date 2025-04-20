package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
	"github.com/gorilla/mux"
)

// 配置信息
const (
	port     = 8080
	dbServer = "127.0.0.1"     // 例如："localhost"或"192.168.1.100"
	dbPort   = 1433            // SQL Server默认端口，如有不同请修改
	dbUser   = "testuser_temp" // 例如："sa"
	dbPass   = "Temp1234"      // 您的SQL Server密码
	dbName   = "PdmCode"       // 包含IssueRecords表的数据库名
)

// IssueRecord 结构体定义
type IssueRecord struct {
	ID           int       `json:"id"`
	SNID         string    `json:"snid"`
	Name         string    `json:"name"`
	UserID       string    `json:"userid"`
	RAID         string    `json:"raid"`
	EqpNo        string    `json:"eqpno"`
	Model        string    `json:"model"`
	MaterNo      string    `json:"materno"`
	SCID         string    `json:"scid"`
	Question     string    `json:"question"`
	Advice       string    `json:"advice"`
	CreateDate   time.Time `json:"createdate"`
	QuestionArea string    `json:"questionarea"`
	QuestionType string    `json:"questiontype"`
	BusinessType *int      `json:"businesstype"`
	EngineerType *int      `json:"engineertype"`
}

// 分页响应结构体
type PaginatedResponse struct {
	Records     []IssueRecord `json:"records"`
	TotalCount  int           `json:"totalCount"`
	TotalPages  int           `json:"totalPages"`
	CurrentPage int           `json:"currentPage"`
}

// 查询参数结构体
type QueryParams struct {
	EqpNo        string `json:"eqpno"`        // 设备编号
	Name         string `json:"name"`         // 模块号（原设备名称）
	Model        string `json:"model"`        // 设变文件（原设备型号）
	StartDate    string `json:"startDate"`    // 开始日期
	EndDate      string `json:"endDate"`      // 结束日期
	Page         int    `json:"page"`         // 页码
	PageSize     int    `json:"pageSize"`     // 每页大小
	BusinessType *int   `json:"businesstype"` // 业务类型
	EngineerType *int   `json:"engineertype"` // 工程师类型
}

var db *sql.DB

func main() {
	// 连接数据库
	var err error

	// 修改连接字符串格式，确保使用正确的SQL Server格式
	connString := fmt.Sprintf("server=%s;user id=%s;password=%s;port=%d;database=%s;encrypt=disable;trustservercertificate=true",
		dbServer, dbUser, dbPass, dbPort, dbName)

	log.Printf("尝试连接到数据库，连接字符串: %s", connString)

	db, err = sql.Open("mssql", connString)
	if err != nil {
		log.Fatalf("打开数据库连接失败: %v", err)
	}

	// 设置连接池参数
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Minute * 3)

	// 测试数据库连接
	err = db.Ping()
	if err != nil {
		log.Fatalf("测试数据库连接失败，请检查SQL Server是否运行以及连接信息是否正确: %v", err)
	}

	log.Println("成功连接到数据库")

	// 检查数据表是否存在
	var tableExists int
	err = db.QueryRow("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'IssueRecords'").Scan(&tableExists)
	if err != nil {
		log.Printf("检查表存在性时出错: %v", err)
	} else if tableExists == 0 {
		log.Printf("警告: IssueRecords表不存在于数据库中")
	} else {
		log.Printf("IssueRecords表已在数据库中找到")

		// 检查表中有多少条记录
		var recordCount int
		err = db.QueryRow("SELECT COUNT(*) FROM IssueRecords").Scan(&recordCount)
		if err != nil {
			log.Printf("计算记录数时出错: %v", err)
		} else {
			log.Printf("IssueRecords表中共有 %d 条记录", recordCount)
		}
	}

	// 设置路由
	r := mux.NewRouter()

	// 静态文件服务
	fs := http.FileServer(http.Dir("./static"))
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", fs))

	// API路由
	r.HandleFunc("/api/issues", getIssues).Methods("GET")
	r.HandleFunc("/api/issues/{id}/business", updateBusinessType).Methods("PUT")
	r.HandleFunc("/api/issues/{id}/engineer", updateEngineerType).Methods("PUT")

	// 添加测试接口
	r.HandleFunc("/api/test", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := db.Ping(); err != nil {
			json.NewEncoder(w).Encode(map[string]string{
				"status":  "error",
				"message": "数据库连接失败: " + err.Error(),
			})
			return
		}
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "success",
			"message": "服务器运行正常，数据库连接正常",
		})
	}).Methods("GET")

	// 主页路由
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./static/index.html")
	})

	// 启动服务器
	log.Printf("服务器启动在端口 %d...\n", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), r))
}

func getIssues(w http.ResponseWriter, r *http.Request) {
	// 打印接收到的请求信息
	log.Printf("接收到查询请求：%s", r.URL.String())

	// 检查数据库连接
	if err := db.Ping(); err != nil {
		log.Printf("数据库连接已断开: %v", err)
		http.Error(w, "数据库连接错误: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 获取查询参数
	queryParams := QueryParams{
		EqpNo:     r.URL.Query().Get("eqpno"),
		Name:      r.URL.Query().Get("name"),
		Model:     r.URL.Query().Get("model"),
		StartDate: r.URL.Query().Get("startDate"),
		EndDate:   r.URL.Query().Get("endDate"),
		Page:      1,
		PageSize:  10,
	}

	// 页码和每页条数
	if page, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil && page > 0 {
		queryParams.Page = page
	}

	if pageSize, err := strconv.Atoi(r.URL.Query().Get("pageSize")); err == nil && pageSize > 0 {
		queryParams.PageSize = pageSize
	}

	// 业务类型和工程师类型
	tabType := r.URL.Query().Get("tabType")
	log.Printf("标签类型: %s", tabType)

	// 当数据库连接出现问题或不存在表时，返回模拟数据（调试模式）
	shouldUseTestData := false

	// 检查表是否存在
	var tableExists int
	err := db.QueryRow("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'IssueRecords'").Scan(&tableExists)
	if err != nil || tableExists == 0 {
		shouldUseTestData = true
	}

	if shouldUseTestData {
		// 返回测试数据
		var records []IssueRecord

		// 基于标签类型返回不同的测试数据
		if tabType == "pending" {
			records = append(records, IssueRecord{
				ID:           1,
				SNID:         "TEST001",
				Name:         "待处理设备",
				EqpNo:        "EQ001",
				Model:        "Model-A",
				Question:     "待处理问题",
				CreateDate:   time.Now(),
				QuestionArea: "电气",
				QuestionType: "启动问题",
			})
		} else if tabType == "business" {
			records = append(records, IssueRecord{
				ID:           2,
				SNID:         "TEST002",
				Name:         "业务已处理设备",
				EqpNo:        "EQ002",
				Model:        "Model-B",
				Question:     "业务已处理问题",
				CreateDate:   time.Now().Add(-24 * time.Hour),
				QuestionArea: "机械",
				QuestionType: "运行问题",
				BusinessType: func() *int { i := 1; return &i }(),
			})
		} else if tabType == "engineer" {
			records = append(records, IssueRecord{
				ID:           3,
				SNID:         "TEST003",
				Name:         "工程师已处理设备",
				EqpNo:        "EQ003",
				Model:        "Model-C",
				Question:     "工程师已处理问题",
				CreateDate:   time.Now().Add(-48 * time.Hour),
				QuestionArea: "软件",
				QuestionType: "系统问题",
				BusinessType: func() *int { i := 1; return &i }(),
				EngineerType: func() *int { i := 1; return &i }(),
			})
		} else {
			// 全部标签，添加所有类型的测试数据
			records = append(records,
				IssueRecord{
					ID:           1,
					SNID:         "TEST001",
					Name:         "待处理设备",
					EqpNo:        "EQ001",
					Model:        "Model-A",
					Question:     "待处理问题",
					CreateDate:   time.Now(),
					QuestionArea: "电气",
					QuestionType: "启动问题",
				},
				IssueRecord{
					ID:           2,
					SNID:         "TEST002",
					Name:         "业务已处理设备",
					EqpNo:        "EQ002",
					Model:        "Model-B",
					Question:     "业务已处理问题",
					CreateDate:   time.Now().Add(-24 * time.Hour),
					QuestionArea: "机械",
					QuestionType: "运行问题",
					BusinessType: func() *int { i := 1; return &i }(),
				},
				IssueRecord{
					ID:           3,
					SNID:         "TEST003",
					Name:         "工程师已处理设备",
					EqpNo:        "EQ003",
					Model:        "Model-C",
					Question:     "工程师已处理问题",
					CreateDate:   time.Now().Add(-48 * time.Hour),
					QuestionArea: "软件",
					QuestionType: "系统问题",
					BusinessType: func() *int { i := 1; return &i }(),
					EngineerType: func() *int { i := 1; return &i }(),
				})
		}

		testData := PaginatedResponse{
			Records:     records,
			TotalCount:  len(records),
			TotalPages:  1,
			CurrentPage: 1,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(testData)
		return
	}

	// 构建SQL查询
	baseQuery := `SELECT id, snid, name, userid, raid, eqpno, model, materno, SCID, question, advice, createdate, questionarea, questiontype, businesstype, engineertype FROM IssueRecords WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM IssueRecords WHERE 1=1`

	var conditions []string
	var mainConditions []string  // 为主查询创建单独的条件字符串
	var countConditions []string // 为计数查询创建单独的条件
	var params []interface{}

	// 添加筛选条件
	if queryParams.EqpNo != "" {
		mainConditions = append(mainConditions, fmt.Sprintf("eqpno LIKE '%%%s%%'", strings.Replace(queryParams.EqpNo, "'", "''", -1)))
		countConditions = append(countConditions, fmt.Sprintf("eqpno LIKE '%%%s%%'", strings.Replace(queryParams.EqpNo, "'", "''", -1)))
	}

	if queryParams.Name != "" {
		// Name参数现在映射到model字段
		mainConditions = append(mainConditions, fmt.Sprintf("model LIKE '%%%s%%'", strings.Replace(queryParams.Name, "'", "''", -1)))
		countConditions = append(countConditions, fmt.Sprintf("model LIKE '%%%s%%'", strings.Replace(queryParams.Name, "'", "''", -1)))
	}

	if queryParams.Model != "" {
		// Model参数现在映射到materno字段
		mainConditions = append(mainConditions, fmt.Sprintf("materno LIKE '%%%s%%'", strings.Replace(queryParams.Model, "'", "''", -1)))
		countConditions = append(countConditions, fmt.Sprintf("materno LIKE '%%%s%%'", strings.Replace(queryParams.Model, "'", "''", -1)))
	}

	if queryParams.StartDate != "" {
		// 处理日期格式
		startDate := queryParams.StartDate // 不需要替换，前端直接发送空格格式
		log.Printf("开始日期: %s", startDate)
		mainConditions = append(mainConditions, fmt.Sprintf("createdate >= '%s'", strings.Replace(startDate, "'", "''", -1)))
		countConditions = append(countConditions, fmt.Sprintf("createdate >= '%s'", strings.Replace(startDate, "'", "''", -1)))
	}

	if queryParams.EndDate != "" {
		// 处理日期格式
		endDate := queryParams.EndDate // 不需要替换，前端直接发送空格格式
		log.Printf("结束日期: %s", endDate)
		mainConditions = append(mainConditions, fmt.Sprintf("createdate <= '%s'", strings.Replace(endDate, "'", "''", -1)))
		countConditions = append(countConditions, fmt.Sprintf("createdate <= '%s'", strings.Replace(endDate, "'", "''", -1)))
	}

	// 添加业务类型和工程师类型过滤
	var typeCondition string
	if tabType == "pending" {
		typeCondition = "((businesstype IS NULL OR businesstype = 0) AND (engineertype IS NULL OR engineertype = 0))"
		conditions = append(conditions, typeCondition)
		mainConditions = append(mainConditions, typeCondition)
		countConditions = append(countConditions, typeCondition)
	} else if tabType == "business" {
		typeCondition = "((businesstype IS NOT NULL AND businesstype > 0) AND (engineertype IS NULL OR engineertype = 0))"
		conditions = append(conditions, typeCondition)
		mainConditions = append(mainConditions, typeCondition)
		countConditions = append(countConditions, typeCondition)
	} else if tabType == "engineer" {
		typeCondition = "(engineertype IS NOT NULL AND engineertype > 0)"
		conditions = append(conditions, typeCondition)
		mainConditions = append(mainConditions, typeCondition)
		countConditions = append(countConditions, typeCondition)
	}
	// all 标签不需要额外的过滤条件

	// 拼接条件
	if len(conditions) > 0 {
		// 不再需要条件字符串和参数
		// 保留conditions数组仅用于日志记录
		_ = strings.Join(conditions, " AND ")
	}

	// 拼接主查询的条件
	if len(mainConditions) > 0 {
		mainConditionStr := strings.Join(mainConditions, " AND ")
		baseQuery += " AND " + mainConditionStr
	}

	// 拼接计数查询的条件
	if len(countConditions) > 0 {
		countConditionStr := strings.Join(countConditions, " AND ")
		countQuery += " AND " + countConditionStr
	}

	// 排序和分页
	offset := (queryParams.Page - 1) * queryParams.PageSize
	baseQuery += " ORDER BY createdate DESC OFFSET " + strconv.Itoa(offset) + " ROWS FETCH NEXT " + strconv.Itoa(queryParams.PageSize) + " ROWS ONLY"

	// 打印查询信息以便调试
	log.Printf("查询SQL: %s", baseQuery)
	log.Printf("参数数量: %d", len(params))
	for i, param := range params {
		log.Printf("参数 @p%d: %v", i+1, param)
	}

	// 构建响应
	var response PaginatedResponse

	// 查询总记录数
	var totalCount int
	log.Printf("计数SQL: %s", countQuery)

	// 对于计数查询，直接使用字符串SQL，不使用参数
	err = db.QueryRow(countQuery).Scan(&totalCount)
	if err != nil {
		log.Printf("查询总记录数失败: %v", err)
		http.Error(w, "查询总记录数失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("查询到记录总数: %d", totalCount)

	// 计算总页数
	totalPages := (totalCount + queryParams.PageSize - 1) / queryParams.PageSize

	// 如果没有数据，返回空结果
	if totalCount == 0 {
		response = PaginatedResponse{
			Records:     []IssueRecord{},
			TotalCount:  0,
			TotalPages:  0,
			CurrentPage: queryParams.Page,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	// 查询记录
	log.Printf("查询SQL: %s", baseQuery)

	// 直接使用SQL字符串查询，不使用参数
	rows, err := db.Query(baseQuery)
	if err != nil {
		log.Printf("查询记录失败: %v", err)
		http.Error(w, "查询记录失败: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// 处理查询结果
	var records []IssueRecord
	for rows.Next() {
		var r IssueRecord
		var businessType sql.NullInt32
		var engineerType sql.NullInt32
		var scid, model, materno sql.NullString

		err := rows.Scan(&r.ID, &r.SNID, &r.Name, &r.UserID, &r.RAID, &r.EqpNo, &model, &materno, &scid,
			&r.Question, &r.Advice, &r.CreateDate, &r.QuestionArea, &r.QuestionType, &businessType, &engineerType)
		if err != nil {
			log.Printf("扫描记录失败: %v", err)
			http.Error(w, "扫描记录失败: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// 处理可能为NULL的字段
		if model.Valid {
			r.Model = model.String
		}

		if materno.Valid {
			r.MaterNo = materno.String
		}

		if scid.Valid {
			r.SCID = scid.String
		}

		if businessType.Valid {
			bt := int(businessType.Int32)
			r.BusinessType = &bt
		}

		if engineerType.Valid {
			et := int(engineerType.Int32)
			r.EngineerType = &et
		}

		records = append(records, r)
	}

	// 构建响应
	response = PaginatedResponse{
		Records:     records,
		TotalCount:  totalCount,
		TotalPages:  totalPages,
		CurrentPage: queryParams.Page,
	}

	// 返回JSON响应
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// 更新业务类型
func updateBusinessType(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	// 检查数据库连接
	if err := db.Ping(); err != nil {
		log.Printf("数据库连接已断开: %v", err)
		http.Error(w, "数据库连接错误: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 更新业务类型为1 - 使用直接字符串拼接
	query := fmt.Sprintf("UPDATE IssueRecords SET businesstype = 1 WHERE id = %s", id)

	log.Printf("执行业务更新SQL: %s", query)
	_, err := db.Exec(query)
	if err != nil {
		log.Printf("更新业务类型失败: %v", err)
		http.Error(w, "更新业务类型失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 返回成功响应
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "业务类型更新成功"})
}

// 更新工程师类型
func updateEngineerType(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	// 检查数据库连接
	if err := db.Ping(); err != nil {
		log.Printf("数据库连接已断开: %v", err)
		http.Error(w, "数据库连接错误: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 更新工程师类型为1 - 使用直接字符串拼接
	query := fmt.Sprintf("UPDATE IssueRecords SET engineertype = 1 WHERE id = %s", id)

	log.Printf("执行工程师更新SQL: %s", query)
	_, err := db.Exec(query)
	if err != nil {
		log.Printf("更新工程师类型失败: %v", err)
		http.Error(w, "更新工程师类型失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 返回成功响应
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "工程师类型更新成功"})
}
