# Design QA - NewLife30 Landing Journey

## Comparison target

- Journey poster source: `/Users/linzhang/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/a40528590_3037/temp/RWTemp/2026-07/aed0441d82e31074e89879e8397476b3/82a889882c1af7385e53f77c4c31c5b0.png`
- Landing direction source: `/Users/linzhang/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/a40528590_3037/temp/RWTemp/2026-07/aed0441d82e31074e89879e8397476b3/4cae5913668eef67327396e25f52717b.png`
- Implementation capture: `/tmp/newlife30-design-qa/landing-home-viewport.png`
- Browser and state: local Vite app at `http://localhost:5174/`, first-visit landing homepage.

## Full-view comparison

The implementation uses the second source as a layout and hierarchy reference: a white navigation bar, broad pale-blue hero, large navy-and-blue headline, one primary action, one explanatory action, and a focused panel on the right. It does not copy the reference pixel-for-pixel. The right panel is made more user-friendly by converting a generic audience description into four directly actionable problem states.

The first source is incorporated as the actual journey-map content rather than being reduced to an internal planning artifact. The image appears in the homepage journey section with product-specific explanatory copy before and after it.

## Required fidelity surfaces

- Typography and hierarchy: the headline, concise supporting copy, and blue emphasis create a clear first-read order without dashboard density.
- Layout and spacing: the header, hero, problem panel, journey map, system grid, and closing action are separated into readable full-width sections with generous whitespace.
- Colors and components: navy, blue, pale blue, white, and restrained pink status marks follow the supplied landing direction. Buttons, lists, borders, and cards have clear interactive affordances.
- Asset fidelity: the user-provided journey poster is stored at `public/images/newlife30-user-journey-map.png` and rendered with descriptive alt text.
- Responsive intent: the homepage collapses the hero, action buttons, journey highlights, and eight-system grid for narrow screens; desktop visual verification was completed in this pass.

## Interaction evidence

- `开启 30 天重塑之旅` was found once and routed to `为现在的你生成 30 天重启路径`.
- The `睡不好、醒不来` problem entry was found once and carried the matching state into the restart assessment.
- The workspace `首页` navigation returned to the public landing view.
- The journey-poster image was found once in the rendered accessibility tree.
- Browser console errors: none.

## Findings

No actionable P0, P1, or P2 findings remain for the requested landing-page direction. The browser full-page stitching preview duplicated sticky regions, so the QA comparison uses the clean viewport capture rather than that tool artifact.

## Follow-up polish

- P3: capture an actual narrow mobile browser viewport after the final content copy is approved.
- P3: supply the production Supabase, SMS, and WeChat OAuth credentials, then enable the already-implemented account flow.

## Follow-up implementation verification

- The website now renders an account and cloud-sync panel, a configured-time browser reminder center, and Day 1, 7, 14, and 30 checkpoint reports with claimable badges.
- The cloud-auth interface is intentionally configuration-gated: no SMS code, WeChat credential, or server secret is embedded in the browser bundle. The Supabase migration defines authenticated-owner RLS for progress snapshots.
- The mini-program dashboard now starts from the same four problem entries as the website and exposes the official `wx.requestSubscribeMessage` integration point for approved reminder templates.
- Browser smoke test: landing to workbench navigation succeeded; account boundary, reminder center, and Day 1 checkpoint were present; the Day 1 badge changed to claimed state; browser console errors were empty.
- Production DNS check: `newlife30.cn` and `www.newlife30.cn` serve/redirect correctly. The `.com` Nginx redirect is ready and locally verified with Host routing, but its public DNS and TLS certificate remain blocked until the registrar points both `.com` names to the production server.

## Guided URL and task-flow verification

- Public task URLs are now stable hash routes: `#/today`, `#/path`, `#/courses`, `#/review`, `#/systems`, `#/body`, `#/programs`, and `#/method`.
- Every task route now opens with a plain-language question, one sentence explaining what to do on that page, and one clear next action.
- The workspace primary navigation is reduced to five user goals: today, 30-day path, premium courses, records and review, and the eight systems. Supporting functions are available under `more tools` rather than competing with the daily action.
- The today page retains the daily route, check-in, engagement feedback, milestone checkpoint, and task list. Campaigns, media, account, reminders, game mechanics, goal planning, and deeper tools are preserved behind one explicit expandable section.
- Browser smoke test: direct navigation to `#/today`, `#/path`, `#/courses`, `#/review`, and `#/systems` rendered the matching route title. The main navigation updated the address from `#/today` to `#/path`; the advanced-tools panel opened and exposed reminder and goal tools. Browser console errors: none.

## Homepage Rebuild Route Refresh

- The public homepage now uses the supplied pale blue, high-clarity direction: a concise navigation bar, one self-assessment action, one roadmap action, a readable four-stage visual route, and four visible product promises.
- The hero route intentionally uses original HTML/CSS components rather than copying the supplied website image. It explains the same product logic: recover state, establish action, expand capability, and form direction.
- The supplied `我的30天人生重建路线图` is stored at `public/images/newlife30-30-day-roadmap.png` and presented as the formal four-stage, eight-system route asset.
- Each phase card leads to a real destination: recovery opens systems, action opens today, capability opens courses, and direction opens the 30-day path.
- Browser verification: the `开始30秒系统自测` button routed to `#/today` and displayed the restart assessment; the roadmap image rendered once; desktop and 390px mobile screenshots showed no title/button overlap; browser console errors were empty.

## Integrated Growth Capability Refresh

- NewLife30 now presents its combined growth loop as six connected, actionable capabilities: personalized starting point, goal-to-action mapping, task and reward feedback, premium courses, peer support, and outcome reporting.
- The capability model deliberately keeps the useful patterns previously studied in international growth products while keeping NewLife30's own differentiation: 30-day structured delivery, adaptive action preferences, local-life task design, evidence-based XP, and small-group accountability.
- The homepage explains all six capabilities without turning the hero into a feature catalogue. The daily workspace now exposes a progress-aware growth hub instead of hiding the full product system behind a generic advanced-tools label.
- Every hub action was wired to a real surface: preference map, goal map, quest engine, course workbench, group space, or outcome ledger. The goal and quest buttons were browser-tested and automatically opened the corresponding advanced tool.
- Responsive verification: desktop uses a three-column capability grid; 390px mobile uses a single-column flow. No browser console errors were observed.

final result: passed
