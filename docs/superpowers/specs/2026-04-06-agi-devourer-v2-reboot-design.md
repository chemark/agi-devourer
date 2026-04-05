# AGI Devourer V2 Reboot Design

Date: 2026-04-06
Status: Approved for planning
Scope: New V2 alpha direction after fully abandoning the previous V2 implementation

## 1. Summary

V2 will be rebuilt as a product-first mobile web experience rather than a gameplay-first prototype.

The product goal of the first release is to establish a clean user conversion loop:

1. User lands on a portrait product homepage.
2. User starts a run as a guest.
3. User is guided into a landscape gameplay session.
4. User sees a meaningful result screen.
5. User is prompted to log in.
6. After login, the held result is submitted to the leaderboard and the user receives ranking feedback.

This first release is not the final commercial product and not a pure visual demo. It is an alpha with correct product structure, stable flow, and clean boundaries for future real backend integration.

## 2. Product Direction

### 2.1 Primary product position

The first V2 release is a light product shell wrapped around a replayable arcade game.

The priority is:

1. Product flow clarity
2. Login and leaderboard conversion structure
3. Stable portrait-to-landscape experience
4. Gameplay that is fun enough to support the loop

The priority is not:

1. Shipping the most feature-rich gameplay version
2. Shipping full sharing and growth systems immediately
3. Integrating real backend services in the first implementation pass

### 2.2 Core experience promise

The user should feel:

- "I can understand this quickly."
- "I can play immediately as a guest."
- "If I perform well, logging in to rank feels worthwhile."

## 3. Target Platform and Orientation Strategy

### 3.1 Device priority

The first release is mobile web first.

### 3.2 Orientation model

- The homepage is portrait-first.
- The gameplay session is landscape-first.
- The user does not jump directly from portrait homepage into active gameplay.
- The user enters a dedicated landscape preparation screen first.

### 3.3 Rotation behavior

The selected behavior is:

- The user starts from a portrait product page.
- After pressing the main challenge CTA, the app enters a preparation page.
- The preparation page instructs the user to rotate the device.
- The actual run begins only after the user reaches the landscape-ready state and confirms start.

This preserves product readability on entry while respecting two-hand gameplay ergonomics during play.

## 4. User Flow

The primary V2 alpha flow is:

1. Portrait homepage
2. Tap "Start Challenge"
3. Landscape preparation page
4. Landscape game session
5. Result page
6. Login prompt if user is still a guest
7. Login success
8. Pending score submission
9. Leaderboard success feedback with current rank
10. Replay or return to homepage

### 4.1 Homepage intent

The homepage must:

- Establish product identity
- Show ranking motivation
- Provide a visible login entry
- Provide a dominant start CTA

The homepage must not:

- Force login before the first run
- Overload the user with story or complex onboarding
- Behave like the active gameplay screen

### 4.2 Result-to-login conversion

The result page is the key conversion surface.

If the user is not logged in:

- The score is treated as pending
- The page explains that login is required for ranking
- The login action is presented as the path to preserve and rank that run

If login succeeds:

- The app returns to the result context
- The pending score is submitted automatically
- The user receives leaderboard confirmation and rank feedback

## 5. Information Architecture

The alpha should have only five core surfaces.

### 5.1 Portrait homepage

Responsibilities:

- Present title and short hook
- Show leaderboard preview
- Show login entry point
- Offer a strong "Start Challenge" CTA
- Optionally show a lightweight activity or battle report slot

### 5.2 Landscape preparation page

Responsibilities:

- Explain that landscape is required before active play starts
- Briefly show controls
- Provide explicit start confirmation

### 5.3 Landscape gameplay page

Responsibilities:

- Run the 60-second session
- Keep gameplay visually and interactively focused
- Avoid unrelated product UI noise

### 5.4 Result page

Responsibilities:

- Show score and performance summary
- Show brief result copy
- Explain ranking eligibility
- Trigger login conversion when needed

### 5.5 Login prompt or login page

Responsibilities:

- Explain why login is needed
- Complete the login state transition
- Return the user to their score submission outcome

## 6. Gameplay Design for Alpha

### 6.1 Core loop

The first gameplay version must remain compact:

- One run lasts 60 seconds
- The player controls a cyber chameleon hunting AI model targets
- The interaction model stays simple and readable
- The landscape layout should support comfortable two-hand mobile play

The gameplay should be fun enough to create replay desire, but it should not expand into a heavyweight system in the alpha.

### 6.2 Enemies

The first version should include 3 to 5 AI model target types.

Variation comes from:

- Point value
- Movement speed
- Hit difficulty

The alpha should not include deep enemy AI, complex ability systems, or over-designed behavior trees.

### 6.3 Difficulty pacing

The match pacing should follow three beats:

- Early phase: teach the player quickly
- Mid phase: introduce visible pressure and speed-up
- Late phase: create a near-breakpoint feeling

The full run should support the conversion goal:

- Loss should feel like "one more try"
- Strong performance should feel worth ranking

### 6.4 Result copy

The result screen should show short generated-feeling battle copy.

For alpha:

- The UX should reserve this as a product feature
- The actual implementation can be rule-based or mock-generated
- Real AI generation is not required in the first pass

## 7. Authentication and Leaderboard Strategy

### 7.1 Login policy

The selected product rule is:

- Guests can play immediately
- Login is required before leaderboard submission

### 7.2 Login provider strategy

The long-term intended primary provider is WeChat login.

For alpha:

- The UI, state model, and service interface should be designed around an eventual WeChat login flow
- The actual login implementation is a mock flow
- Real WeChat authorization is explicitly out of scope for the first pass

### 7.3 Leaderboard strategy

For alpha:

- The leaderboard should behave like a product feature, not a fake screen
- The service layer and app states should mimic real read/submit flows
- The underlying implementation can use mock data and local logic

This ensures the UI and flow do not need to be redesigned once real backend integration begins.

## 8. Feature Scope

### 8.1 In scope for alpha

- Portrait mobile homepage
- Landscape preparation page
- Landscape gameplay session
- Result page with conversion intent
- Login flow as a mock WeChat-oriented product flow
- Leaderboard preview and post-login ranking feedback
- Mock product services for auth, leaderboard, and result copy
- Rule-based or mock-generated result text
- Guest-to-login-to-rank end-to-end flow

### 8.2 Out of scope for alpha

- Real WeChat OAuth integration
- Real backend user system
- Real remote leaderboard persistence
- Share posters, QR code flow, and growth distribution
- Heavy story systems
- Complex meta progression
- Overbuilt gameplay mechanics

## 9. Technical Architecture

### 9.1 Recommended architecture

The first pass should use:

- React + Vite + TypeScript for the product shell
- A lightweight Canvas + TypeScript gameplay module for the active run
- Mock service modules for auth, leaderboard, and result generation

### 9.2 Why not Phaser first

Phaser is not rejected permanently. It is being deferred intentionally.

Reasoning:

- The previous V2 attempt became unstable while simultaneously handling engine complexity, gameplay, product screens, and service-like behavior
- The alpha priority is product flow correctness, not engine depth
- A lighter gameplay module reduces restart risk and speeds validation

If future iterations require richer animation, collision systems, or broader gameplay complexity, the gameplay container can be upgraded or replaced later without invalidating the product shell.

### 9.3 Module boundaries

Recommended boundaries:

- `app shell`
  Owns routing, orientation state, high-level product flow, and screen composition
- `game session`
  Owns one gameplay run only
- `result flow`
  Owns score summary, pending submission state, and post-login completion
- `mock product services`
  Own auth, leaderboard, and result generation contracts

The gameplay module must not directly own login or leaderboard logic.

## 10. Data Flow

The core alpha data flow is:

1. Guest lands on homepage
2. Guest starts a challenge
3. User rotates and starts a run
4. Game session produces score and result summary
5. Result flow stores a pending leaderboard submission if user is not logged in
6. User completes mock login
7. Auth state updates globally
8. Pending score is submitted through leaderboard service
9. User sees confirmation, rank, and replay options

This flow is the backbone of the alpha and must be preserved even when internal implementations change.

## 11. Error Handling and Fallbacks

The alpha should degrade gracefully:

- If login fails, the current result must remain visible and recoverable
- If leaderboard submission fails, the user should be informed without losing the run context
- If result generation fails, the UI should fall back to fixed template copy
- If the device is not in the expected orientation, the user should see a clear rotate prompt and a way back

## 12. Validation Criteria

The first release is successful if the following are true:

1. A guest can discover the product intent immediately from the homepage
2. A guest can complete a full run on mobile without confusion
3. The portrait-to-landscape transition feels intentional rather than broken
4. The result screen creates a credible reason to log in
5. A mock login can complete and automatically carry the user into rank submission feedback
6. The overall structure feels like a product alpha, not a disconnected prototype

## 13. Delivery Strategy

The implementation should be staged around the main product loop:

1. Product shell and orientation flow
2. Minimal but solid gameplay run
3. Result flow and pending score behavior
4. Mock login and leaderboard submission
5. Visual polish and product coherence

This sequence keeps the rebuild focused and reduces the chance of another overbuilt but unsatisfying V2.
