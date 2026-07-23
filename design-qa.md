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
- P3: connect the `登录 / 注册` style entry to the eventual real account flow instead of routing it to the current workbench.

final result: passed
