# AGENT WORKFLOW 
---

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
   - Nghi ngờ giữa 2 cấp → chọn cấp cao hơn.
   - Việc phình to giữa chừng → DỪNG, thăng cấp, viết spec.

VIII. CHECKPOINT XÁC NHẬN (human-in-the-loop theo ranh giới PHASE)
   - Kết thúc mỗi phase: agent DỪNG, trình bày (1) artifact vừa tạo,
     (2) trạng thái DoD, (3) các điểm cần người dùng quyết định —
     rồi chờ xác nhận tường minh mới sang phase kế.
   - Im lặng hoặc trả lời mơ hồ ≠ đồng ý. Chỉ xác nhận tường minh
     ("approved" / "tiếp tục") mới được đi tiếp.
   - Xác nhận theo PHASE, không theo TASK: bên trong Phase 5,
     subagent chạy liên tục với review tự động 2 tầng — không dừng
     chờ người dùng sau từng task (ngoại lệ duy nhất: phát hiện
     spec sai → DỪNG và hỏi, theo điều I).
   - Mật độ checkpoint co giãn theo cấp định tuyến:
     Cấp 3: mọi ranh giới phase | Cấp 2: trước code + trước merge
     Cấp 1: trước merge         | Cấp 0: không cần

IX. QUYỀN TỐI CAO CỦA DEV (override chẩn đoán của AI)
   - Chẩn đoán cấp của AI chỉ là ĐỀ XUẤT. Quyết định cuối thuộc về Dev.
   - HẠ cấp: phải kèm lý do trỏ tới sự thật kiểm chứng được trong
     codebase (helper/pattern/convention đã tồn tại). Đây là sửa lỗi
     "AI chẩn đoán sai vì thiếu bối cảnh", hợp lệ.
     Ví dụ: "Override: xuống Cấp 2 vì module X đã có Helper Y xử lý việc này."
   - NÂNG cấp: luôn được, không cần lý do (nghiêng về phía an toàn).
   - GIỚI HẠN CỨNG: override chỉ dịch chuyển TẦNG ĐẶC TẢ (bỏ bớt gate
     spec). KHÔNG override được TẦNG THỰC THI — điều II (TDD) và III
     (bằng chứng) là hằng số, không mệnh lệnh nào bỏ được.
   - Override phải để lại dấu vết trong PR/commit (lý do + ai quyết),
     để khi task hỏng về sau còn truy được nguồn gốc.
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
| **2 — Feature nhỏ** | 1 module; mọi quyết định thiết kế đều đã có câu trả lời trong spec/convention (không phải tự nghĩ ra) | **Lean:** `/speckit.specify → /speckit.plan → /speckit.tasks` (bỏ clarify/checklist/analyze; gộp PR-spec + PR-code làm 1) | Đầy đủ: subagent + TDD + review 2 tầng |
| **3 — Feature lớn** | Nhiều module; HOẶC có ít nhất 1 quyết định thiết kế mà câu trả lời chưa nằm sẵn ở đâu (hai kỹ sư có thể chọn khác nhau → ra hai sản phẩm khác nhau); production-critical | **Full:** toàn bộ vòng đời ở mục 3 với đủ 5 gate | Đầy đủ |

### Luật chống lách cấp

- **Định tuyến bằng bản chất, không bằng thời lượng.** Ranh giới Cấp 2 ↔ Cấp 3 là *số module + có hay không quyết định thiết kế chưa được trả lời sẵn*, không phải "mất bao lâu". Thời gian phụ thuộc người làm nên không đo được khách quan; một task 1 module dù mất 2 ngày vẫn là Cấp 2.
- **Phép thử quyết định thiết kế (trả lời yes/no):** *"Có quyết định nào mà câu trả lời KHÔNG nằm sẵn trong spec/tài liệu/convention hiện có, và nếu hai kỹ sư chọn khác nhau thì cho ra hai sản phẩm khác nhau không?"* — Có → Cấp 3. Không → Cấp 2.
  - Ví dụ **CÓ** (→ Cấp 3): "API này gặp request chưa xác thực thì trả 401 hay 403?" khi chưa tài liệu nào quy định.
  - Ví dụ **KHÔNG** (→ vẫn Cấp 2): "đặt tên biến `userId` hay `uid`?" — convention đã có, hoặc chọn sao cũng không đổi hành vi.
- **Dấu hiệu thăng cấp giữa chừng:** chạm module thứ hai, HOẶC phép thử trên chuyển từ "Không" sang "Có".
- **Dev override chẩn đoán của AI (điều IX).** Chẩn đoán cấp của AI chỉ là đề xuất. Dev *hạ cấp* được nếu kèm lý do trỏ tới sự thật kiểm chứng được ("module X đã có Helper Y") — đây là sửa lỗi AI thiếu bối cảnh, không phải lách. Dev *nâng cấp* thì luôn được, không cần lý do. Nhưng override chỉ đụng tầng đặc tả; TDD + bằng chứng (điều II, III) không override được. Ghi lý do vào PR/commit.
- **Nghi ngờ giữa 2 cấp → chọn cấp cao hơn.** Chi phí thừa một gate rẻ hơn nhiều chi phí thiếu một spec.
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
   ⑦  PR-spec: team review Ý ĐỊNH                   GATE 4: người duyệt
                                                                  ▼
════════ TẦNG THỰC THI (Superpowers — kỷ luật không khoan nhượng) ═

   ⑧  worktree → subagent/task → RED-GREEN-REFACTOR → review 2 tầng
                                                                  ▼
════════ ĐÓNG VÒNG (đặc tả kiểm chứng lại thực thi) ═══════════════

   ⑨  /speckit.converge → PR-code → merge           GATE 5: hết drift
```

### Checkpoint xác nhận của người dùng (điều VIII)

Với Cấp 3, agent dừng chờ xác nhận tường minh tại **5 điểm**: sau clarify (⑦❶ spec chốt), sau checklist (❷ plan chốt), sau analyze (❸ tasks chốt — chính là lúc mở PR-spec), sau khi implement xong toàn bộ tasks (❹ trước converge), và trước merge (❺). Khi dừng, agent phải trình: artifact + trạng thái DoD + các điểm cần quyết. **Không dừng theo từng task trong Phase 5** — review tự động 2 tầng đảm nhận việc đó; dừng giữa Phase 5 chỉ khi phát hiện spec sai.

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

8. Mở **PR-spec** chỉ chứa `specs/NNN-feature/`. Team review **ý định** trước khi tốn compute cho code — gate rẻ nhất chặn sai lầm đắt nhất. Đây là lý do artifact phải nằm ở tầng Spec Kit: Markdown trong repo, diff được, comment được, approve được.

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
- **2 loại PR tách biệt**: PR-spec (review ý định — tầng đặc tả) trước, PR-code (review hiện thực — tầng thực thi) sau.
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
| Override hạ cấp mà lý do là "thấy nó nhỏ" chứ không trỏ tới sự thật trong code | Định tuyến — override thành cửa hậu né spec | Điều IX: hạ cấp phải viện dẫn helper/pattern/convention có thật, kiểm chứng được |
| Dùng override để bỏ TDD/test ("Override: khỏi cần test cho nhanh") | Thực thi — vi phạm hằng số II, III | Override chỉ đụng tầng đặc tả; kỷ luật thực thi bất khả xâm phạm |
| Chờ xác nhận sau TỪNG TASK trong Phase 5 | Thực thi — người dùng thành nút cổ chai, thông lượng subagent sụp đổ | Xác nhận theo ranh giới phase (điều VIII); review tự động lo tầng task |
| Agent tự coi im lặng là đồng ý rồi chạy tiếp | Cả hệ thống — checkpoint thành hình thức | Điều VIII: chỉ xác nhận tường minh mới được đi tiếp |
| Vá triệu chứng bug | Thực thi — bug tái phát | `systematic-debugging`: root cause trước |

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
   ⏸ CHỜ XÁC NHẬN ❶: spec chốt
   □ /speckit.plan → □ /speckit.checklist
   ⏸ CHỜ XÁC NHẬN ❷: plan chốt
   □ /speckit.tasks (task 2–5 phút, file path, verify, test-first)
   □ /speckit.analyze — hết Critical
   ⏸ CHỜ XÁC NHẬN ❸: PR-spec → team approve
   TẦNG THỰC THI (Superpowers)
   □ Worktree + subagent/task + RED-GREEN-REFACTOR + review 2 tầng
     (không dừng theo task; chỉ dừng nếu spec sai → quay về tầng đặc tả)
   ⏸ CHỜ XÁC NHẬN ❹: implement xong, trước converge
   ĐÓNG VÒNG
   □ /speckit.converge → PR-code
   ⏸ CHỜ XÁC NHẬN ❺: merge → xóa worktree
```