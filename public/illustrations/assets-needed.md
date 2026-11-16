# Illustration Assets Needed & Audit

All illustration assets are stored in SVG format under `public/illustrations/`.

| Filename | Aspect Ratio | Used In | Alt Text Intent / Purpose | Optional Dark Variant (`-dark.svg`) |
| --- | --- | --- | --- | --- |
| `hero.svg` | 16/9 | Home (`/`) Hero section | Mentor and student guiding toward the CTA | `hero-dark.svg` (Optional) |
| `problem-scattered.svg` | 4/3 | Home (`/`) The Problem | Three disconnected tools (video, quiz, chat) | `problem-scattered-dark.svg` (Optional) |
| `solution-unified.svg` | 4/3 | Home (`/`) The Solution | One integrated platform for modern learning | `solution-unified-dark.svg` (Optional) |
| `step-choose.svg` | 4/3 | Home (`/`) How It Works (Step 1) | Student browsing and selecting courses | — |
| `step-learn.svg` | 4/3 | Home (`/`) How It Works (Step 2) | Student learning with structured video & reading | — |
| `step-track.svg` | 4/3 | Home (`/`) How It Works (Step 3) | Student taking quiz and earning badges | — |
| `become-mentor.svg` | 4/3 | Home (`/`) Mentor Invitation | Mentor presenting and inviting others to teach | — |
| `courses-banner.svg` | 9/4 | Course Catalog (`/courses`) Header | Courses catalog hero illustration (viewBox 900x400 = 9:4) | `courses-banner-dark.svg` (Optional) |
| `categories/default.svg` | 16/9 | Course Card (`/courses`, `/dashboard/*`) | Default fallback course cover illustration | — |
| `categories/design.svg` | 16/9 | Course Card (`/courses`, `/dashboard/*`) | Design category course cover illustration | — |
| `categories/programming.svg` | 16/9 | Course Card (`/courses`, `/dashboard/*`) | Programming category course cover illustration | — |
| `categories/business.svg` | 16/9 | Course Card (`/courses`, `/dashboard/*`) | Business category course cover illustration | — |
| `categories/marketing.svg` | 16/9 | Course Card (`/courses`, `/dashboard/*`) | Marketing category course cover illustration | — |
| `categories/data-science.svg` | 16/9 | Course Card (`/courses`, `/dashboard/*`) | Data Science category course cover illustration | — |
| `empty-search.svg` | 4/3 | Course Catalog, Mentors Directory & Leaderboard empty state | Empty search query result illustration | `empty-search-dark.svg` (Optional) |
| `dashboard-student.svg` | 16/9 | Student Dashboard (`/dashboard/student`) | Student studying at laptop with progress ring | `dashboard-student-dark.svg` (Optional) |
| `empty-learning.svg` | 4/3 | Student Dashboard (`/dashboard/student`) | Empty state when student has no enrolled courses | `empty-learning-dark.svg` (Optional) |
| `certificate-sample.svg` | 4/3 | Student Dashboard (`/dashboard/student`) | Completed course certificate sample preview | — |
| `dashboard-mentor.svg` | 16/9 | Mentor Dashboard (`/dashboard/mentor`) | Mentor teaching at presentation board | `dashboard-mentor-dark.svg` (Optional) |
| `empty-courses.svg` | 4/3 | Mentor Dashboard (`/dashboard/mentor`) | Empty state when mentor has created no courses | `empty-courses-dark.svg` (Optional) |
| `empty-lessons.svg` | 4/3 | Mentor Dashboard (`/dashboard/mentor`) | Empty curriculum state when course has no lessons | `empty-lessons-dark.svg` (Optional) |
| `lesson-reading.svg` | 16/9 | Learn Page (`/learn/[courseId]`) | Fallback reading graphic when lesson has no video | `lesson-reading-dark.svg` (Optional) |
| `quiz-locked.svg` | 4/3 | Learn Page (`/learn/[courseId]`) | Visual state for quiz locked | — |
| `quiz-ready.svg` | 4/3 | Learn Page (`/learn/[courseId]`) | Visual state for quiz ready | — |
| `quiz-passed.svg` | 4/3 | Learn Page (`/learn/[courseId]`) | Celebration visual for quiz passed | — |
| ~~`mentors-banner.svg`~~ | ~~6/2~~ | ~~Mentors Directory (`/mentors`)~~ | **Removed** — replaced by the live Top Mentors leaderboard panel. File can be deleted. | — |
| `profile-cover.svg` | 6/2 | Student Profile (`/profile`), Mentor (`/mentors/[id]`) | Profile hero cover backdrop banner | `profile-cover-dark.svg` (Optional) |
| `portfolio-default.svg` | 16/9 | Mentor Profile (`/mentors/[id]`) | Default portfolio card image when none uploaded | — |
| `auth-login.svg` | 16/9 | Login Page (`/login`) | Portal of knowledge & student entering | `auth-login-dark.svg` (Optional) |
| `auth-register.svg` | 16/9 | Register Page (`/register`) | Graduate receiving welcome certification badge | `auth-register-dark.svg` (Optional) |
| `auth-password.svg` | 16/9 | Forgot Password (`/forgot-password`) | Shield and golden key for account recovery | — |
| `admin-banner.svg` | 3/1 | Admin Dashboard (`/admin/dashboard`) | Admin verification checklist and shield banner | `admin-banner-dark.svg` (Optional) |

## Dark Mode Implementation Details

`ImageSlot` supports an optional `darkSrc` prop. When provided, `ImageSlot` dynamically switches between `src` and `darkSrc` based on the active theme (`dark` vs `light`/`system`).

When a `-dark` variant is not available:
1. `ImageSlot` embeds the default SVG on a soft tinted dark panel (`dark:bg-slate-900/90 dark:border dark:border-slate-800/80`) to ensure intentional contrast without harsh white edges.
2. Photos, user uploads (course covers, portfolio images, avatars) are rendered directly without inversion and with subtle glare protection (`dark:brightness-95`).
3. Skeletons and placeholder states render with `dark:bg-slate-800`.

