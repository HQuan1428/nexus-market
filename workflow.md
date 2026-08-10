# AGENT WORKFLOW — Spec Kit × Superpowers


## 0. Triết lý thiết kế (đọc trước khi làm bất cứ điều gì)

```
┌─────────────────────────────────────────────────────────────────┐
│  SPEC KIT      lo TÍNH TƯỜNG MINH CÓ KIỂM CHỨNG của đặc tả      │
│                (template chuẩn + gate xác minh + artifact       │
│                 agent-agnostic, review được qua PR)             │
│                                                                 │
│  SUPERPOWERS   lo KỶ LUẬT THỰC THI                              │
│                (TDD không khoan nhượng + subagent clean-context │
│                 + review 2 tầng + bằng chứng thay lời tuyên bố) │
└─────────────────────────────────────────────────────────────────┘
```

Mọi quyết định trong workflow này đều suy ra từ nguyên tắc trên. Khi gặp tình huống chưa được quy định, hãy tự hỏi: *"Đây là vấn đề về đặc tả hay về thực thi?"* — câu trả lời quyết định plugin nào sở hữu.

### Ma trận phân quyền

| Hoạt động | Sở hữu | Vai trò của plugin còn lại |
|---|---|---|
| Constitution (luật bất biến của project) | **Spec Kit** | Superpowers thực thi theo luật này ở Phase 5 |
| Brainstorm ý tưởng mơ hồ (pre-spec) | **Superpowers** | Output chỉ là *nguyên liệu thô* cho Spec Kit, chưa phải đặc tả |
| Spec / Clarify / Plan / Tasks / Analyze / Checklist | **Spec Kit** | Superpowers đóng góp **tiêu chuẩn chất lượng** cho tasks (task 2–5 phút, file path, verify) — không đóng vai người viết |
| Implement / TDD / Subagent / Code review / Debugging | **Superpowers** | Spec Kit cung cấp `tasks.md` làm nguồn lệnh duy nhất; agent không có Superpowers chạy `/speckit.implement` theo constitution |
| Kiểm chứng nhất quán spec ↔ plan ↔ tasks ↔ code | **Spec Kit** (analyze, converge) | Superpowers kiểm chứng ở tầng task (test pass, review pass) |

### Ba điều cấm tuyệt đối

- ❌ **Không** dùng `writing-plans` của Superpowers để plan feature. Plan nằm ngoài chuỗi artifact của Spec Kit thì `/speckit.analyze` không soi được — mất tính kiểm chứng, vi phạm triết lý tầng đặc tả.
- ❌ **Không** dùng brainstorm của Superpowers thay cho `/speckit.clarify`. Brainstorm làm rõ theo dòng hội thoại (cái không ai nghĩ tới thì không ai hỏi); clarify quét spec theo template một cách hệ thống. Hai lớp lọc khác nhau.
- ❌ **Không** cho bất kỳ agent nào viết code khi chưa có `spec.md` + `plan.md` + `tasks.md` được duyệt. Code không truy vết được về spec = bug, kể cả khi chạy đúng.

---

## 1. Phase 0 — Constitution: mối hàn giữa hai tầng (chạy 1 lần)

Constitution là nơi **kỷ luật thực thi của Superpowers được luật hóa vào tầng đặc tả của Spec Kit**. Nhờ đó, agent không có Superpowers (Copilot, Cursor...) vẫn bị ràng buộc bởi cùng kỷ luật, và agent có Superpowers thì được enforce cứng gấp đôi.

```
/speckit.constitution Thiết lập các nguyên tắc bất biến:

I. SPEC LÀ SOURCE OF TRUTH (tầng đặc tả)
   - Công việc Cấp 2–3 (xem điều VII): không code khi chưa có artifact
     đặc tả tương ứng được approve.
   - Requirement đổi: sửa spec → regenerate plan/tasks → mới sửa code.
   - Mọi thay đổi hành vi phải truy vết được về spec; bug fix làm lộ
     spec sai thì phải sửa spec trong cùng PR.

II. TDD NGHIÊM NGẶT (tầng thực thi — NON-NEGOTIABLE)
   - Mọi task tuân theo RED → GREEN → REFACTOR.
   - Test phải FAIL trước khi viết implementation.
   - Code viết trước test phải bị XÓA và làm lại.

III. BẰNG CHỨNG THAY LỜI TUYÊN BỐ (tầng thực thi)
   - Task chỉ done khi có bằng chứng: test pass + review pass, chạy được, xem được.
   - "Tôi đã kiểm tra rồi" không phải bằng chứng.

IV. SIMPLICITY (cả hai tầng)
   - YAGNI: không viết code/spec cho tương lai giả định.
   - DRY: không lặp logic, không lặp đặc tả.
   - Mỗi task 2–5 phút, một trách nhiệm duy nhất.

V. GATES (tầng đặc tả kiểm chứng tầng thực thi)
   - Spec phải qua /speckit.clarify trước khi plan.
   - Tasks phải qua /speckit.analyze trước khi implement.
   - Mỗi task xong phải qua review 2 tầng: (1) đúng spec, (2) đạt chất lượng.
   - Issue mức Critical chặn tiến độ, không thương lượng.

VI. WORKSPACE
   - Mỗi feature = 1 branch NNN-feature-name = 1 git worktree.
   - Main branch luôn sạch, luôn xanh.

VII. ĐỊNH TUYẾN THEO ĐỘ LỚN
   - Mọi công việc phải được phân cấp 0/1/2/3 trước khi bắt đầu.
   - Tầng đặc tả co giãn theo cấp; tầng thực thi (điều II, III)
     là HẰNG SỐ ở mọi cấp — không có ngoại lệ.
   - Nghi ngờ giữa 2 cấp → HỎI NGƯỜI DÙNG, không tự đoán. Chỉ khi agent
     chạy autonomous/background không có ai để hỏi thì mới fallback về
     chọn cấp cao hơn.
   - Việc phình to giữa chừng → DỪNG, thăng cấp, viết spec.
```

Constitution commit vào `.specify/memory/constitution.md`, **review qua PR như code**. Đây là cơ chế để cả team — bất kể dùng agent nào — chịu chung một bộ luật.

---

## 2. Định tuyến — chọn cấp quy trình TRƯỚC mọi công việc (30 giây)

Workflow full-gate chỉ dành cho vấn đề lớn. Áp nó cho bug fix 5 dòng là giết chết quy trình — team sẽ bỏ quy trình chứ không bỏ bug. Giải pháp: **tầng đặc tả co giãn theo độ lớn vấn đề, tầng thực thi là hằng số.**

### Bốn câu hỏi định tuyến

1. Có tạo ra hành vi **mới** không, hay chỉ sửa hành vi đã được spec định nghĩa?
2. Chạm bao nhiêu module?
3. Còn điểm **mơ hồ** nào cần người khác trả lời không?
4. Nếu làm sai, hậu quả là gì?

### Bảng cấp

| Cấp | Loại việc | Tầng đặc tả (Spec Kit) | Tầng thực thi (Superpowers) |
|---|---|---|---|
| **0 — Trivial** | Typo, comment, docs, format, rename nội bộ. **Không đổi hành vi.** | Bỏ hoàn toàn | Test suite hiện có phải vẫn xanh |
| **1 — Bug fix / vá nhỏ** | Hành vi đã có spec, sửa 1 chỗ, không mơ hồ | Bỏ chuỗi artifact. Bug do spec sai → sửa `spec.md` ngay trong cùng PR (1 dòng, không chạy lại chuỗi) | **Đầy đủ:** `systematic-debugging` → regression test FAIL (RED) → fix tối thiểu (GREEN) → refactor → review. Bằng chứng bắt buộc |
| **2 — Feature nhỏ** | 1 module, ít mơ hồ, ~1 ngày | **Lean:** `/speckit.specify → /speckit.plan → /speckit.tasks` (bỏ clarify/checklist/analyze; gộp PR-spec + PR-code làm 1) | Đầy đủ: subagent + TDD + review 2 tầng |
| **3 — Feature lớn** | Nhiều module, có mơ hồ, production-critical | **Full:** toàn bộ vòng đời ở mục 3 với đủ 5 gate | Đầy đủ |

### Luật chống lách cấp

- **Nghi ngờ giữa 2 cấp → hỏi người dùng 1 câu ngắn** ("Việc này chạm module X và Y, mình đi Cấp 2 hay 3?") thay vì tự đoán — chi phí hỏi gần như bằng 0 so với chi phí thiếu một spec. Chỉ khi không có ai để hỏi (agent chạy autonomous/background) mới fallback về chọn cấp cao hơn.
- **Việc phình to giữa chừng → DỪNG và thăng cấp.** "Bug fix" mà bắt đầu chạm module thứ hai hoặc phát sinh câu hỏi thiết kế = đó là feature trá hình. Dừng, viết spec, đi đường Cấp 2/3. Không "tiện tay" làm feature dưới danh nghĩa bug fix.
- **Cấp 0/1 không có nghĩa là vô luật.** Constitution điều II (TDD) và III (bằng chứng) áp dụng ở mọi cấp — cái được bỏ là *giấy tờ đặc tả*, không phải *kỷ luật thực thi*.

### Tại sao kỷ luật thực thi không co giãn?

Vì chi phí của nó gần như bằng 0 so với lợi ích: regression test cho một bug fix mất 2 phút viết, nhưng là thứ duy nhất đảm bảo bug không tái phát. Ngược lại, chi phí của tầng đặc tả (viết spec, chạy gate, chờ review) là thật — nên nó mới là thứ cần co giãn.

---

## 3. Vòng đời một Feature (Cấp 3 — Full; Cấp 2 dùng bản lean ở trên)

```
════════ TẦNG ĐẶC TẢ (Spec Kit — tường minh có kiểm chứng) ════════

 [Ý tưởng mơ hồ?] ──> Superpowers /brainstorm (nguyên liệu thô) ──┐
                                                                  ▼
   ①  /speckit.specify  ──>  ②  /speckit.clarify    GATE 1: hết mơ hồ
                                                                  ▼
   ③  /speckit.plan     ──>  ④  /speckit.checklist  GATE 2: plan đầy đủ
                                                                  ▼
   ⑤  /speckit.tasks    ──>  ⑥  /speckit.analyze    GATE 3: nhất quán chéo
                                                                  ▼
   ⑦  REVIEW-spec: team review Ý ĐỊNH                GATE 4: người duyệt
                                                                  ▼
════════ TẦNG THỰC THI (Superpowers — kỷ luật không khoan nhượng) ═

   ⑧  worktree → subagent/task → RED-GREEN-REFACTOR → review 2 tầng
                                                                  ▼
════════ ĐÓNG VÒNG (đặc tả kiểm chứng lại thực thi) ═══════════════

   ⑨  /speckit.converge → PR-code → merge           GATE 5: hết drift
```

### Phase 1 — Spec (Cái gì & Tại sao) — tầng đặc tả

1. **Nếu ý tưởng còn mơ hồ**: chạy Superpowers `/brainstorm`. Agent hỏi Socratic để làm rõ intent, lưu design doc ra file. Output là **nguyên liệu thô**, chưa phải đặc tả — vì nó là văn bản tự do, độ tường minh phụ thuộc phong độ của session, chưa qua template và gate nào.
2. `/speckit.specify` — nấu nguyên liệu thô thành đặc tả chuẩn hóa (WHAT/WHY, user stories, acceptance criteria đo được). **Bắc cầu từ brainstorm — không tự động, phải chỉ định tường minh:**
   - Brainstorm **ngắn, cùng session**: context còn đủ, dùng ngay:
     `/speckit.specify Dựa trên design cuối cùng đã được tôi approve trong brainstorm ở trên (bỏ qua các phương án đã bác bỏ), tạo spec. Chỉ lấy requirement và user intent; phần kỹ thuật để dành cho /speckit.plan`
   - Brainstorm **dài hoặc khác session**: context có thể đã bị compact — luôn neo vào file:
     `/speckit.specify Đọc design doc tại docs/plans/<file>.md, tạo spec từ đó...`
   - Quyết định kỹ thuật trong brainstorm doc → giữ lại làm input cho `/speckit.plan`.
3. `/speckit.clarify` — **bắt buộc kể cả khi đã brainstorm**. Đây là gate hệ thống: quét spec theo template, đánh dấu `[NEEDS CLARIFICATION]`, buộc resolve hết.

**DoD:** `spec.md` theo đúng template, không còn điểm mơ hồ, acceptance criteria đo được.

### Phase 2 — Plan (Như thế nào) — tầng đặc tả

4. `/speckit.plan <tech stack + ràng buộc kiến trúc + quyết định kỹ thuật từ brainstorm nếu có>`. Constitution tự động được inject làm ràng buộc.
5. `/speckit.checklist` — "unit test cho văn bản đặc tả": validate tính đầy đủ, rõ ràng, nhất quán.

**DoD:** `plan.md` tuân thủ constitution, checklist pass.

### Phase 3 — Tasks — tầng đặc tả, nhập khẩu tiêu chuẩn của tầng thực thi

6. `/speckit.tasks` với yêu cầu bắt buộc trong prompt:
   > *"Mỗi task 2–5 phút, một trách nhiệm duy nhất, có file path cụ thể, có bước verify, sắp xếp test-first — đủ tường minh để một junior engineer không có project context vẫn làm đúng."*

   Đây chính là tiêu chuẩn chất lượng của `writing-plans` (Superpowers) được nhập vào format của Spec Kit: **giữ được tính kiểm chứng của chuỗi artifact, đồng thời `tasks.md` đủ tường minh để subagent của Superpowers thực thi trực tiếp** ở Phase 5.
7. `/speckit.analyze` — gate kiểm chứng chéo: mọi requirement đều có task cover, không task nào mâu thuẫn spec/plan/constitution.

**DoD:** `tasks.md` phủ 100% acceptance criteria, analyze không còn issue Critical.

### Phase 4 — Human Gate

8. **Review ý định và Quyết định môi trường duyệt:**
   Sau khi `/speckit.analyze` đạt trạng thái sạch (no Critical), Agent phải DỪNG LẠI và đưa ra lựa chọn cho User:
   
   > *"Đặc tả đã sẵn sàng và nhất quán. Bạn muốn tôi (1) Giữ nguyên ở máy local để bạn tự review và ra lệnh thực thi, hay (2) Tự động push và mở PR-spec để review chung với team?"*

   - **Trường hợp 1 (Duyệt Local):** User review trực tiếp các file trong `specs/`. Nếu đồng ý, Agent BẮT BUỘC phải thực hiện 1 commit cục bộ chỉ chứa folder specs/ với message "spec: [Local Approved] NNN-feature-name", User ra lệnh chuyển thẳng sang Phase 5 (`/speckit.implement` hoặc ra lệnh cho subagent). Toàn bộ spec và code sẽ nằm chung trong 1 PR code cuối cùng.
   - **Trường hợp 2 (Duyệt PR-spec):** User gõ "Yes" hoặc "Mở PR". Agent tiến hành push branch và tạo PR-spec chỉ chứa thư mục `specs/NNN-feature/`. Vòng lặp đóng băng để chờ con người phê duyệt.

### Phase 5 — Implement — tầng thực thi (Superpowers)

9. Trên **Claude Code** (động cơ thực thi chính):
   - Superpowers tạo **git worktree** riêng → nhiều feature chạy song song không đụng nhau.
   - Prompt khởi động:
     > *"Thực thi specs/NNN-feature/tasks.md bằng subagent-driven development. tasks.md là nguồn lệnh duy nhất — không tự ý thêm/bớt scope. Mỗi task một subagent, TDD red-green-refactor theo constitution."*
   - Kỷ luật cho mỗi task: subagent mới với clean context → test FAIL (RED) → code tối thiểu để PASS (GREEN) → REFACTOR → **review 2 tầng** (spec compliance trước, code quality sau) → task kế tiếp. Issue Critical chặn tiến độ.
   - Bug khó: skill `systematic-debugging` — 4 phase, root cause trước, cấm vá triệu chứng.
   - **Phát hiện spec sai/thiếu giữa chừng?** DỪNG task. Không "tiện tay sửa". Quay về tầng đặc tả: sửa spec → regenerate plan/tasks → chạy lại analyze → tiếp tục. Thực thi không được tự ý sửa luật.
10. Trên **agent khác** (không có Superpowers): `/speckit.implement`. Constitution (điều II, III) vẫn ép TDD + bằng chứng — kỷ luật thực thi đã được luật hóa ở Phase 0 nên không phụ thuộc plugin.

**DoD:** mọi task done kèm bằng chứng (test pass + review pass), coverage đạt ngưỡng team.

### Phase 6 — Converge & Merge — đặc tả kiểm chứng lại thực thi

11. `/speckit.converge` — đối chiếu code cuối với spec, phát hiện drift. Vòng lặp SDD chỉ khép kín khi bước này pass.
12. Quyết định lệch spec phát sinh trong lúc implement → **cập nhật spec.md trong cùng PR** (spec là living document, nhưng phải được cập nhật tường minh, không được lệch ngầm).
13. **PR-code** → human review → merge → xóa worktree.

---

## 4. Quy tắc Team (đa agent, chung quy trình)

- **Repo là nguồn quy trình duy nhất**: `.specify/` (constitution, templates) + `specs/` + `.claude/skills/` (skill nội bộ) đều commit vào git. Clone repo = có ngay quy trình, bất kể agent nào.
- **1 feature = 1 branch `NNN-ten-feature` = 1 worktree = 1 thư mục `specs/NNN-ten-feature/`**. Spec Kit tự detect feature theo branch.
- **Linh hoạt cấu trúc PR**: 
  - **Duyệt PR-spec:** Chạy quy trình 2 PR tách biệt (PR-spec merge trước, PR-code merge sau).
  - **Duyệt Local:** Gộp chung 1 PR duy nhất chứa cả `specs/` (đã commit local approved trước đó) và `code` thực thi.
- **Phân vai model theo tầng**: model mạnh nhất cho tầng đặc tả (specify/clarify/plan — nơi sai lầm đắt nhất); model nhanh cho subagent ở tầng thực thi (task đã đủ tường minh, không cần suy luận sâu).
- **Convention nội bộ = skill**: naming, error handling, logging... đóng gói bằng `writing-skills` của Superpowers, commit vào `.claude/skills/` — kỷ luật thực thi của team cũng phải là artifact, không phải lời truyền miệng.
- **Nâng cấp tooling ≠ sửa spec**: cập nhật plugin ở commit riêng, không trộn với thay đổi artifact.

---

## 5. Vibe Mode & Anti-pattern

### Vibe Mode — sandbox hợp pháp (opt-in, cách ly khỏi main)

Vibe coding không bị cấm — nó bị **cách ly**. Default của mọi session là workflow có kỷ luật; muốn vibe phải khai báo tường minh:

- Tuyên bố: *"Vibe mode: thử nghiệm <X>"* → agent tạo worktree trên branch `spike/<ten>`, tắt toàn bộ gate, code tự do.
- Mục đích hợp lệ: thăm dò công nghệ, prototype, kiểm chứng ý tưởng, học API mới.
- **Luật duy nhất: code spike KHÔNG BAO GIỜ merge vào main.** Học xong → vứt code, viết spec theo cấp phù hợp (thường Cấp 2/3), implement lại tử tế. Kiến thức được giữ, code thì không.
- Lý do default không phải vibe: default luôn thắng — thời điểm ta "lười" gọi workflow nhất chính là thời điểm cần nó nhất. Kỷ luật là mặc định, tự do là ngoại lệ được khai báo.

### Anti-pattern

| Anti-pattern | Vi phạm tầng nào | Fix |
|---|---|---|
| Đảo default: vibe coding mặc định, workflow opt-in | Cả hệ thống — default luôn thắng, quy trình chung tan rã | Kỷ luật là default; Vibe Mode là opt-in có khai báo |
| Merge code từ branch spike vào main | Cả hai tầng — code không spec, không test lọt vào truth | Spike chỉ để học; viết spec và làm lại theo cấp |
| Áp full workflow cho bug fix nhỏ | Định tuyến — quy trình nặng làm team bỏ quy trình | Triage 30 giây, đi Cấp 1 |
| "Tiện tay" làm feature dưới danh nghĩa bug fix (lách cấp) | Định tuyến — đặc tả bị bỏ qua ngầm | Việc phình to → DỪNG, thăng cấp |
| Bỏ regression test vì "fix có 5 dòng" | Thực thi — kỷ luật là hằng số ở mọi cấp | Điều II, III áp dụng kể cả Cấp 1 |
| Dùng `writing-plans` của Superpowers plan feature | Đặc tả — plan thoát khỏi vòng kiểm chứng của analyze | `tasks.md` là plan duy nhất; nhập tiêu chuẩn Superpowers qua prompt Phase 3 |
| Giữ song song brainstorm doc và spec.md làm 2 nguồn truth | Đặc tả — 2 nguồn truth sẽ lệch nhau | Brainstorm doc → archive sau khi specify xong; spec.md là truth |
| Bỏ `/speckit.clarify` vì "brainstorm kỹ rồi" | Đặc tả — mất gate quét hệ thống | Clarify bắt buộc với mọi feature production |
| Brainstorm dài rồi specify "dựa trên phần trên" ở session đã bị compact | Đặc tả — context đã mất chi tiết | Neo vào file design doc, không tin trí nhớ session |
| Agent phát hiện spec sai, "tiện tay" code khác spec | Cả hai — thực thi tự sửa luật | Dừng task → sửa spec → regenerate → analyze → tiếp tục |
| Task quá to (30+ phút) | Thực thi — subagent drift, review khó | Ép chuẩn 2–5 phút ngay trong prompt /speckit.tasks |
| Chấp nhận "done" bằng lời tuyên bố | Thực thi — vi phạm điều III | Bằng chứng: test pass + review pass |
| Vá triệu chứng bug | Thực thi — bug tái phát | `systematic-debugging`: root cause trước |
|Code khi chưa commit folder specs/| Đặc tả - không có snapshot cho spec| Bắt buộc Agent tự động commit folder specs/ |

---

## 6. Checklist khởi động nhanh

```
□ /speckit.constitution (luật hóa TDD + evidence + gates + định tuyến) → PR → team approve
□ Với MỌI công việc: TRIAGE 30 giây → chọn Cấp 0/1/2/3
   □ Cấp 0: sửa trực tiếp, test suite vẫn xanh — xong
   □ Cấp 1: systematic-debugging → regression test RED → fix GREEN → review — xong
   □ Cấp 2: specify → plan → tasks (lean) → implement như Cấp 3, gộp 1 PR
□ Với feature Cấp 3 (full):
   TẦNG ĐẶC TẢ (Spec Kit)
   □ (mơ hồ?) /brainstorm → neo output vào file nếu dài
   □ /speckit.specify (chỉ WHAT/WHY, kỹ thuật để dành cho plan)
   □ /speckit.clarify — resolve hết [NEEDS CLARIFICATION]
   □ /speckit.plan → □ /speckit.checklist
   □ /speckit.tasks (task 2–5 phút, file path, verify, test-first)
   □ /speckit.analyze — hết Critical
   □ DUYỆT LOCAL (Agent commit local specs/ -> Implement)
   □ DUYỆT PR-SPEC (Push branch ➔ mở PR-spec ➔ Chờ Team Approve)
   TẦNG THỰC THI (Superpowers)
   □ Worktree + subagent/task + RED-GREEN-REFACTOR + review 2 tầng
   □ Spec sai giữa chừng? → DỪNG → quay về tầng đặc tả
   ĐÓNG VÒNG
   □ /speckit.converge → PR-code → merge → xóa worktree
```