# Taxonomy 服务器部署文档（Docker Compose）

本文基于你仓库里的 `Dockerfile` 与 `docker-compose.yaml`，目标是让你在服务器上“一把梭”跑起来。

## 1. 前置条件

- 服务器系统：Linux（推荐 Ubuntu 22.04+）
- 已安装：
  - Docker 24+
  - Docker Compose v2（`docker compose version` 可用）
- 开放端口：
  - 应用端口（默认 `3000`）
  - 如需外部访问 MySQL，再开放 `3306`（生产通常不开放）

检查命令：

```bash
docker --version
docker compose version
```

## 2. 上传项目到服务器

任选一种方式：

- `git clone` 到服务器
- 本地打包上传（`scp` / `rsync`）

示例：

```bash
git clone <你的仓库地址> taxonomy
cd taxonomy
```

## 3. 准备环境变量

项目根目录创建 `.env`（可从 `.env.example` 复制）：

```bash
cp .env.example .env
```

重点至少检查这些变量：

- `NEXT_PUBLIC_APP_URL`：例如 `https://your-domain.com`
- `NEXTAUTH_URL`：同上，通常与站点 URL 一致
- `NEXTAUTH_SECRET`：至少 32 位随机字符串
- `DATABASE_URL`：
  - 用内置 compose MySQL 时，建议：
    - `mysql://taxonomy:changeme_app@db:3306/taxonomy`
  - 用外部 MySQL 时，改为外部地址
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_ACCESS_TOKEN`
- `SMTP_FROM` / `POSTMARK_*`
- `STRIPE_*`

> 注意：Compose 会自动读取根目录 `.env` 来替换 `docker-compose.yaml` 中的 `${VAR}`。

## 4. 首次部署（带建表）

首次启动建议带迁移：

```bash
RUN_MIGRATIONS=1 docker compose up -d --build
```

查看状态：

```bash
docker compose ps
docker compose logs -f web
```

确认启动后，把 `RUN_MIGRATIONS` 恢复为 `0`（或不传），避免每次重启都跑迁移。

## 5. 日常更新发布

代码更新后：

```bash
git pull
docker compose up -d --build
```

只重启应用（不动数据库）：

```bash
docker compose up -d --build web
```

构建之后拷贝前端 docker cp next-with-strip-web-1:/app/.next/. ./app/.next/ 
数据库连接要使用 docker的网关172.17.0.1,因此url改为 DATABASE_URL="mysql://root:password@172.17.0.1:3306/dbname"

## 6. 域名与 HTTPS（推荐）

建议在服务器前面加 Nginx / Caddy 反向代理：

- 外网 80/443 -> 代理到 `127.0.0.1:3000`
- HTTPS 终止后，记得：
  - `NEXT_PUBLIC_APP_URL=https://your-domain.com`
  - `NEXTAUTH_URL=https://your-domain.com`

## 7. 外部数据库模式（可选）

如果你不想用 compose 里的 `db`：

1. 修改 `.env` 的 `DATABASE_URL` 指向外部 MySQL
2. 在 `docker-compose.yaml` 中：
   - 删除 `db` 服务（或不启动它）
   - 删除 `web.depends_on.db`

然后执行：

```bash
docker compose up -d --build web
```

## 8. 备份与恢复（MySQL）

备份：

```bash
docker compose exec db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > backup.sql
```

恢复：

```bash
cat backup.sql | docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```

## 9. 常用运维命令

查看容器：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f web
docker compose logs -f db
```

重启服务：

```bash
docker compose restart web
docker compose restart db
```

停止服务：

```bash
docker compose down
```

停止并删除数据库卷（危险，会清空数据）：

```bash
docker compose down -v
```

## 10. 回滚方案（简单实用）

建议每次发布前打镜像标签：

```bash
docker build -t taxonomy:2026-04-29 .
docker tag taxonomy:2026-04-29 taxonomy:latest
```

如果新版本有问题，回滚到旧镜像：

```bash
docker tag taxonomy:2026-04-29 taxonomy:latest
docker compose up -d
```

## 11. 故障排查

### 11.1 `env` 校验失败（启动/构建直接报缺变量）

补齐 `.env` 中必填项（`env.mjs` 里定义的字段都要满足）。

### 11.2 `Can't reach database server`

- 检查 `DATABASE_URL` 是否正确
- 检查 `db` 容器是否 healthy：`docker compose ps`
- 看 DB 日志：`docker compose logs -f db`

### 11.3 `table does not exist`

执行迁移：

```bash
docker compose exec web prisma migrate deploy --schema=./prisma/schema.prisma
```

### 11.4 端口冲突

修改 `.env` 的 `WEB_PUBLISH_PORT`，重新 `docker compose up -d`。

---

如果你愿意，我可以再给你补一版「**Nginx 反代 + HTTPS（Let's Encrypt）**」的完整配置文件，直接贴到服务器就能用。
