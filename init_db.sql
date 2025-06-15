-- 检查数据库是否存在，如果不存在则创建
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PdmCode')
BEGIN
    CREATE DATABASE PdmCode;
END
GO

USE PdmCode;
GO

-- 检查表是否存在，如果不存在则创建
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[IssueRecords]') AND type in (N'U'))
BEGIN
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
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
    UNIQUE NONCLUSTERED 
    (
        [snid] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END
GO

-- 清空表中的数据（可选）
-- TRUNCATE TABLE [dbo].[IssueRecords];
-- GO

-- 插入测试数据
-- 待操作记录 (businesstype 和 engineertype 都为 NULL)
IF NOT EXISTS (SELECT TOP 1 * FROM [dbo].[IssueRecords])
BEGIN
    INSERT INTO [dbo].[IssueRecords] 
        ([snid], [name], [userid], [raid], [eqpno], [model], [materno], [SCID], [question], [advice], [createdate], [questionarea], [questiontype], [businesstype], [engineertype])
    VALUES
        ('SN001', '设备A', 'user1', 'RA001', 'EQ001', 'Model-A', 'MAT001', 'SC001', '设备无法启动', '检查电源', GETDATE(), '电气', '启动问题', NULL, NULL),
        ('SN002', '设备B', 'user1', 'RA002', 'EQ002', 'Model-B', 'MAT002', 'SC002', '显示屏闪烁', '更换显示器', DATEADD(day, -1, GETDATE()), '显示', '显示问题', NULL, NULL),
        ('SN003', '设备C', 'user2', 'RA003', 'EQ003', 'Model-C', 'MAT003', 'SC003', '无法连接网络', '检查网线', DATEADD(day, -2, GETDATE()), '网络', '连接问题', NULL, NULL),
        ('SN004', '设备D', 'user2', 'RA004', 'EQ004', 'Model-D', 'MAT004', 'SC004', '噪音过大', '检查风扇', DATEADD(day, -3, GETDATE()), '机械', '噪音问题', NULL, NULL),
        ('SN005', '设备E', 'user3', 'RA005', 'EQ005', 'Model-E', 'MAT005', 'SC005', '温度过高', '清理散热器', DATEADD(day, -4, GETDATE()), '温控', '温度问题', NULL, NULL);

    -- 业务已操作记录 (businesstype = 1, engineertype = NULL)
    INSERT INTO [dbo].[IssueRecords] 
        ([snid], [name], [userid], [raid], [eqpno], [model], [materno], [SCID], [question], [advice], [createdate], [questionarea], [questiontype], [businesstype], [engineertype])
    VALUES
        ('SN006', '设备F', 'user3', 'RA006', 'EQ006', 'Model-F', 'MAT006', 'SC006', '软件崩溃', '重装软件', DATEADD(day, -5, GETDATE()), '软件', '崩溃问题', 1, NULL),
        ('SN007', '设备G', 'user4', 'RA007', 'EQ007', 'Model-G', 'MAT007', 'SC007', '按钮失灵', '更换按钮', DATEADD(day, -6, GETDATE()), '硬件', '按钮问题', 1, NULL),
        ('SN008', '设备H', 'user4', 'RA008', 'EQ008', 'Model-H', 'MAT008', 'SC008', '数据丢失', '恢复数据', DATEADD(day, -7, GETDATE()), '数据', '存储问题', 1, NULL),
        ('SN009', '设备I', 'user5', 'RA009', 'EQ009', 'Model-I', 'MAT009', 'SC009', '屏幕无显示', '检查显卡', DATEADD(day, -8, GETDATE()), '显示', '屏幕问题', 1, NULL),
        ('SN010', '设备J', 'user5', 'RA010', 'EQ010', 'Model-J', 'MAT010', 'SC010', '系统卡顿', '升级内存', DATEADD(day, -9, GETDATE()), '性能', '速度问题', 1, NULL);

    -- 工程师已操作记录 (businesstype = 1, engineertype = 1)
    INSERT INTO [dbo].[IssueRecords] 
        ([snid], [name], [userid], [raid], [eqpno], [model], [materno], [SCID], [question], [advice], [createdate], [questionarea], [questiontype], [businesstype], [engineertype])
    VALUES
        ('SN011', '设备K', 'user6', 'RA011', 'EQ011', 'Model-K', 'MAT011', 'SC011', '无法开机', '更换主板', DATEADD(day, -10, GETDATE()), '电气', '开机问题', 1, 1),
        ('SN012', '设备L', 'user6', 'RA012', 'EQ012', 'Model-L', 'MAT012', 'SC012', '散热不良', '更换散热片', DATEADD(day, -11, GETDATE()), '温控', '散热问题', 1, 1),
        ('SN013', '设备M', 'user7', 'RA013', 'EQ013', 'Model-M', 'MAT013', 'SC013', '电池续航差', '更换电池', DATEADD(day, -12, GETDATE()), '电源', '电池问题', 1, 1),
        ('SN014', '设备N', 'user7', 'RA014', 'EQ014', 'Model-N', 'MAT014', 'SC014', '无法关机', '修复系统', DATEADD(day, -13, GETDATE()), '系统', '关机问题', 1, 1),
        ('SN015', '设备O', 'user8', 'RA015', 'EQ015', 'Model-O', 'MAT015', 'SC015', 'USB接口失效', '更换USB控制器', DATEADD(day, -14, GETDATE()), '接口', 'USB问题', 1, 1);
END
GO

-- 检查数据是否插入成功
SELECT COUNT(*) AS TotalRecords FROM [dbo].[IssueRecords];
GO 