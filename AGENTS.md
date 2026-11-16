<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI work rules

- UI only: never touch `services/`, authentication, database schema, or Supabase RLS policies.
- Reuse existing components and the existing styling approach. This project uses Tailwind CSS utilities.
- Primary color is the existing blue; warm yellow is reserved only for mentor point badges.
- Design mobile-first, then desktop. Keep tap targets at least 44px and text contrast at least WCAG AA (4.5:1).
- Use an image-rich design: pair text blocks with related visuals, use illustrations to show mentors, students, and actions such as uploading, learning, quizzing, and tracking progress. Characters should face or point toward the main call-to-action.
- Do not generate artwork, illustrations, or photos. Use the shared `ImageSlot` component for files in `public/illustrations/`; never hotlink external images.
- Every image needs meaningful alternative text (use an empty value only for purely decorative images), explicit dimensions or an aspect ratio to prevent layout shift, and lazy loading below the fold through `next/image`.
- After each change, run lint and build, and fix errors before finishing.
- Keep diffs small and explain what changed in three to five lines.
