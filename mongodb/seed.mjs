// Seeds Skill Galaxy with starter groups and skills for a data-science +
// web-development learning path.
//
// Idempotent: it only INSERTS what is missing. Re-running never overwrites
// groups/skills you have edited (progress, status, names, order).
//
// Usage:
//   npm run db:seed

import { connect } from "./connect.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "skill_galaxy";

/** icon must match a key in src/components/icons.tsx, else a fallback shows. */
const SEED = [
  {
    slug: "python-data-science",
    name: "Python & Data Science",
    icon: "terminal",
    description: "Core Python, pandas and NumPy — the base for everything else.",
    sortOrder: 1,
    skills: [
      { name: "Python 3 Documentation", url: "https://docs.python.org/3/", icon: "code", status: "mastered", progress: 100, description: "Language reference and tutorial." },
      { name: "Pandas User Guide", url: "https://pandas.pydata.org/docs/user_guide/", icon: "database", status: "learning", progress: 60, description: "DataFrames, groupby, time series." },
      { name: "NumPy Documentation", url: "https://numpy.org/doc/stable/", icon: "layers", status: "practiced", progress: 80, description: "Broadcasting and vectorized ops." },
      { name: "SQL Tutorial for Data Science", url: "https://mode.com/sql-tutorial/", icon: "database", status: "practiced", progress: 75, description: "Window functions and CTEs." },
      { name: "Kaggle Learn", url: "https://www.kaggle.com/learn", icon: "graduation", status: "learning", progress: 45, description: "Short hands-on micro-courses." },
    ],
  },
  {
    slug: "machine-learning",
    name: "Machine Learning",
    icon: "brain",
    description: "From classical ML to deep learning and shipping models.",
    sortOrder: 2,
    skills: [
      { name: "Scikit-learn User Guide", url: "https://scikit-learn.org/stable/user_guide.html", icon: "brain", status: "learning", progress: 55, description: "Pipelines, metrics, model selection." },
      { name: "ML Specialization (Coursera)", url: "https://www.coursera.org/specializations/machine-learning-introduction", icon: "graduation", status: "learning", progress: 40, description: "Andrew Ng — supervised/unsupervised." },
      { name: "Statistics & Probability", url: "https://www.khanacademy.org/math/statistics-probability", icon: "target", status: "practiced", progress: 70, description: "Distributions, testing, inference." },
      { name: "PyTorch Tutorials", url: "https://pytorch.org/tutorials/", icon: "flame", status: "not_started", progress: 0, description: "Tensors through training loops." },
      { name: "MLflow Docs", url: "https://mlflow.org/docs/latest/index.html", icon: "wrench", status: "not_started", progress: 0, description: "Experiment tracking and model registry." },
    ],
  },
  {
    slug: "data-visualization",
    name: "Data Visualization",
    icon: "palette",
    description: "Turning analyses into charts people actually understand.",
    sortOrder: 3,
    skills: [
      { name: "Matplotlib Tutorials", url: "https://matplotlib.org/stable/tutorials/", icon: "palette", status: "practiced", progress: 75, description: "Figures, axes, customization." },
      { name: "Seaborn Tutorial", url: "https://seaborn.pydata.org/tutorial.html", icon: "palette", status: "learning", progress: 45, description: "Statistical plots on DataFrames." },
      { name: "Plotly Python", url: "https://plotly.com/python/", icon: "play", status: "learning", progress: 50, description: "Interactive charts and dashboards." },
      { name: "Storytelling with Data", url: "https://www.storytellingwithdata.com/", icon: "book", status: "not_started", progress: 0, description: "Chart choice and visual narrative." },
    ],
  },
  {
    slug: "frontend-development",
    name: "Frontend Development",
    icon: "code",
    description: "React, TypeScript and the modern component stack.",
    sortOrder: 4,
    skills: [
      { name: "React Learn", url: "https://react.dev/learn", icon: "atom", status: "learning", progress: 65, description: "Components, hooks, escape hatches." },
      { name: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/", icon: "braces", status: "learning", progress: 50, description: "Generics, narrowing, utility types." },
      { name: "Tailwind CSS Docs", url: "https://tailwindcss.com/docs", icon: "palette", status: "practiced", progress: 80, description: "Utilities, variants, theming." },
      { name: "Next.js Learn", url: "https://nextjs.org/learn", icon: "rocket", status: "learning", progress: 35, description: "App Router, server components." },
      { name: "web.dev Accessibility", url: "https://web.dev/learn/accessibility/", icon: "shield", status: "not_started", progress: 0, description: "Keyboard, ARIA, contrast." },
    ],
  },
  {
    slug: "backend-apis",
    name: "Backend & APIs",
    icon: "server",
    description: "Node, route handlers, databases and auth.",
    sortOrder: 5,
    skills: [
      { name: "Node.js API Reference", url: "https://nodejs.org/docs/latest/api/", icon: "server", status: "learning", progress: 40, description: "Modules, streams, async." },
      { name: "MongoDB Manual", url: "https://www.mongodb.com/docs/manual/", icon: "database", status: "learning", progress: 45, description: "Aggregation, indexing, modeling." },
      { name: "Next.js Route Handlers", url: "https://nextjs.org/docs/app/building-your-application/routing/route-handlers", icon: "layers", status: "learning", progress: 30, description: "API routes in the App Router." },
      { name: "REST API Design", url: "https://restfulapi.net/", icon: "network", status: "practiced", progress: 70, description: "Resources, status codes, verbs." },
      { name: "Auth0 Docs", url: "https://auth0.com/docs", icon: "shield", status: "not_started", progress: 0, description: "Sessions, OAuth, JWT." },
    ],
  },
  {
    slug: "devops-tooling",
    name: "DevOps & Tooling",
    icon: "wrench",
    description: "Git, containers, the shell and shipping to production.",
    sortOrder: 6,
    skills: [
      { name: "Pro Git Book", url: "https://git-scm.com/book/en/v2", icon: "git", status: "mastered", progress: 100, description: "Branching, rebasing, internals." },
      { name: "Docker Get Started", url: "https://docs.docker.com/get-started/", icon: "boxes", status: "learning", progress: 50, description: "Images, volumes, compose." },
      { name: "Linux Command Line", url: "https://linuxcommand.org/", icon: "terminal", status: "practiced", progress: 75, description: "Shell, pipes, permissions." },
      { name: "WSL Documentation", url: "https://learn.microsoft.com/en-us/windows/wsl/", icon: "monitor", status: "practiced", progress: 80, description: "Windows + Linux dev environment." },
      { name: "GitHub Actions Docs", url: "https://docs.github.com/en/actions", icon: "flag", status: "not_started", progress: 0, description: "CI/CD workflows." },
    ],
  },
];

let client;
let insertedGroups = 0;
let insertedSkills = 0;
let skipped = 0;

try {
  client = await connect(uri);
  const db = client.db(dbName);
  const groups = db.collection("groups");
  const skills = db.collection("skills");
  const now = new Date();

  for (const group of SEED) {
    // $setOnInsert only — existing groups (and your edits) are left untouched.
    const groupResult = await groups.updateOne(
      { slug: group.slug },
      {
        $setOnInsert: {
          name: group.name,
          slug: group.slug,
          description: group.description,
          icon: group.icon,
          sortOrder: group.sortOrder,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );

    const groupId =
      groupResult.upsertedId ??
      (await groups.findOne({ slug: group.slug }, { projection: { _id: 1 } }))?._id;

    if (!groupId) {
      throw new Error(`Could not resolve group id for "${group.slug}"`);
    }

    if (groupResult.upsertedCount > 0) insertedGroups += 1;

    for (const [index, skill] of group.skills.entries()) {
      const skillResult = await skills.updateOne(
        { groupId, name: skill.name },
        {
          $setOnInsert: {
            groupId,
            name: skill.name,
            url: skill.url,
            icon: skill.icon,
            description: skill.description,
            status: skill.status,
            progress: skill.progress,
            sortOrder: index,
            position: null, // filled in later by dragging a chip in the galaxy
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true },
      );

      if (skillResult.upsertedCount > 0) insertedSkills += 1;
      else skipped += 1;
    }
  }

  const [groupCount, skillCount] = await Promise.all([
    groups.countDocuments(),
    skills.countDocuments(),
  ]);

  console.log(`Database: ${dbName}`);
  console.log(`New groups inserted : ${insertedGroups}`);
  console.log(`New skills inserted : ${insertedSkills}`);
  console.log(`Already existed     : ${skipped} (left untouched)`);
  console.log(`Totals              : ${groupCount} groups, ${skillCount} skills`);
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await client?.close();
}
