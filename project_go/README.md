# 设备问题管理系统

这是一个使用Go语言开发的设备问题管理系统，前端使用HTML和JavaScript。

## 项目结构

```
project_go/
├── main.go          # 后端主程序
├── go.mod           # Go模块定义
├── static/          # 静态文件目录
│   ├── index.html   # 主页HTML
│   ├── styles.css   # CSS样式
│   └── script.js    # JavaScript脚本
└── README.md        # 项目说明文档
```

## 功能特点

- 四个标签页：待操作、业务已操作、工程师已操作、全部
- 模糊查询支持：设备编号、名称、型号、创建时间范围
- 分页显示数据
- 实时显示当前时间
- 支持业务确认和工程师确认操作
- 响应式设计，适应不同屏幕尺寸

## 安装与运行

1. 确保安装了Go开发环境（建议Go 1.16+）
2. 克隆或下载本项目代码
3. 安装依赖：

```bash
go mod download
```

4. 配置数据库连接：
   - 在`main.go`文件中修改数据库连接信息（常量部分）

5. 运行项目：

```bash
go run main.go
```

6. 在浏览器中访问：http://localhost:8080

## 数据库结构

系统依赖SQL Server数据库中的`IssueRecords`表：

```sql
CREATE TABLE [dbo].[IssueRecords](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[snid] [nvarchar](50) NOT NULL,
	[name] [nvarchar](100) NOT NULL,
	[userid] [nvarchar](50) NOT NULL,
	[raid] [nvarchar](50) NOT NULL,
	[eqpno] [nvarchar](50) NOT NULL,
	[model] [nvarchar](100) NULL,
	[materno] [nvarchar](200) NULL,
	[SCID] [nvarchar](50) NULL,
	[question] [nvarchar](max) NOT NULL,
	[advice] [nvarchar](max) NULL,
	[createdate] [datetime] NOT NULL,
	[questionarea] [nvarchar](50) NOT NULL,
	[questiontype] [nvarchar](50) NOT NULL,
	[businesstype] [int] NULL,
	[engineertype] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[snid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
```

## API接口

- `GET /api/issues` - 获取问题记录，支持分页和筛选
- `PUT /api/issues/{id}/business` - 更新业务处理状态
- `PUT /api/issues/{id}/engineer` - 更新工程师处理状态

## 开发技术

- 后端：Go语言，使用gorilla/mux路由，go-mssqldb连接SQL Server
- 前端：HTML5，CSS3，现代JavaScript（ES6+）
- 数据库：SQL Server 