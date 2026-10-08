// 볼트(content)의 변경을 커밋하고 v5 브랜치로 푸시해 GitHub Actions 배포를 시작한다.
import { execFileSync } from "node:child_process"
import { realpathSync } from "node:fs"

const run = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim()

const BRANCH = "v5"
const blog = process.cwd()

if (run(blog, "branch", "--show-current") !== BRANCH) {
  console.error(`✖ ${BRANCH} 브랜치에서만 실행할 수 있어요.`)
  process.exit(1)
}

// content 가 볼트(05_Blog)로 연결된 정션이면 볼트를 먼저 최신으로 맞춘다.
const target = realpathSync("content")
if (target !== `${blog}\content` && target !== `${blog}/content`) {
  try {
    const vault = run(target, "rev-parse", "--show-toplevel")
    console.log(`볼트 최신화: ${vault}`)
    run(vault, "pull", "--ff-only")
  } catch {
    console.error("✖ 볼트를 pull 하지 못했어요. 볼트의 변경/충돌을 먼저 정리해 주세요.")
    process.exit(1)
  }
}

run(blog, "add", "content")
if (run(blog, "diff", "--cached", "--name-only", "--", "content") === "") {
  console.log("올릴 변경이 없어요.")
  process.exit(0)
}

const stat = run(blog, "diff", "--cached", "--stat", "--", "content")
console.log(stat)

const stamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
run(blog, "commit", "-m", `Update posts: ${stamp}`, "--", "content")
run(blog, "pull", "--rebase", "origin", BRANCH)
run(blog, "push", "origin", BRANCH)
console.log("✔ 푸시 완료. 몇 분 뒤 https://eeseuju.github.io/blog 에 반영돼요.")
