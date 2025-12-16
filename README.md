This is a [Next.js](https://nextjs.org) project with integrated [Sanity Studio](https://www.sanity.io/docs/sanity-studio) for content management.

## Project Structure

- `/app` - Next.js app router pages and routes
- `/components` - React components
- `/lib` - Utility functions and Sanity client configuration
- `/sanity` - Sanity Studio schema definitions
- `/types` - TypeScript type definitions
- `/app/studio` - Sanity Studio route (accessible at `/studio`)

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

- **Frontend**: Open [http://localhost:3000](http://localhost:3000) to view the site
- **Sanity Studio**: Open [http://localhost:3000/studio](http://localhost:3000/studio) to manage content

## Sanity Configuration

The Sanity configuration is centralized in:
- `lib/sanity.config.ts` - Shared configuration (project ID, dataset, etc.)
- `sanity.config.ts` - Studio configuration
- `sanity.cli.ts` - CLI configuration for Sanity commands

All schemas are defined in `/sanity/schemaTypes/`:
- `post.js` - Blog post schema
- `category.js` - Category schema
- `tag.js` - Tag schema
- `author.js` - Author schema

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
