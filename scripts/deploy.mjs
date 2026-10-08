// 볼트(content 가 가리키는 폴더)와 블로그 레포를 각각 커밋하고 푸시한다.
// 블로그 v5 브랜치로 푸시되면 GitHub Actions 가 배포를 시작한다.
import { execFileSync } from "node:child_process"
import { realpathSync } from "node:fs"

const run = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim()

const BRANCH = "v5"
const blog = process.cwd()
const stamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })

if (run(blog, "branch", "--show-current") !== BRANCH) {
  console.error(`✖ ${BRANCH} 브랜치에서만 실행할 수 있어요.`)
  process.exit(1)
}

// 1) 볼트: 변경을 커밋하고, 다른 PC의 변경을 받은 뒤 푸시한다.
const target = realpathSync("content")
if (target !== `${blog}\\content` && target !== `${blog}/content`) {
  const vault = run(target, "rev-parse", "--show-toplevel")
  console.log(`볼트: ${vault}`)
  try {
    run(vault, "add", "-A")
    if (run(vault, "diff", "--cached", "--name-only") !== "") {
      run(vault, "commit", "-m", `chore: 블로그 배포 시점 동기화 (${stamp})`)
      console.log("볼트 변경을 커밋했어요.")
    }
    run(vault, "pull", "--rebase")
    run(vault, "push")
    console.log("볼트 푸시 완료.")
  } catch {
    console.error("✖ 볼트 동기화에 실패했어요. 볼트에서 충돌이나 네트워크 상태를 확인해 주세요.")
    process.exit(1)
  }
}

// 2) 블로그: content 의 변경을 커밋하고 푸시한다.
run(blog, "add", "content")
if (run(blog, "diff", "--cached", "--name-only", "--", "content") === "") {
  console.log("블로그에 올릴 변경이 없어요.")
  process.exit(0)
}

console.log(run(blog, "diff", "--cached", "--stat", "--", "content"))
run(blog, "commit", "-m", `Update posts: ${stamp}`, "--", "content")
run(blog, "pull", "--rebase", "origin", BRANCH)
run(blog, "push", "origin", BRANCH)
console.log("✔ 푸시 완료. 몇 분 뒤 https://eeseuju.github.io/blog 에 반영돼요.")
