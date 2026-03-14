#!/usr/bin/env node
/**
 * Storage Migration Script
 * 
 * Downloads all files from the old Lovable Cloud storage buckets
 * and uploads them to your new Supabase instance.
 * 
 * Usage:
 *   1. Install dependency:  npm install @supabase/supabase-js
 *   2. Set environment variables:
 *      export NEW_SUPABASE_URL="https://your-project.supabase.co"
 *      export NEW_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *   3. Run:  node scripts/migrate-storage.mjs
 */

import { createClient } from "@supabase/supabase-js";

const OLD_SUPABASE_URL = "https://toxucscjfmaoayircihp.supabase.co";

const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL;
// Support both names to avoid shell/env confusion
const NEW_SUPABASE_KEY =
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEW_SUPABASE_KEY;

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_KEY) {
  console.error("❌ Missing environment variables:");
  console.error("   export NEW_SUPABASE_URL='https://your-project.supabase.co'");
  console.error("   export NEW_SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'");
  console.error("   # or: export NEW_SUPABASE_KEY='your-service-role-key'");
  process.exit(1);
}

// Normalize key (remove whitespace/zero-width chars/wrapping quotes)
const cleanKey = NEW_SUPABASE_KEY
  .replace(/[\u200B-\u200D\uFEFF]/g, "")
  .trim()
  .replace(/^['"]+|['"]+$/g, "")
  .replace(/\s+/g, "");

const cleanUrl = NEW_SUPABASE_URL.trim();
const isApiKeyFormat = cleanKey.startsWith("sb_");
const isJwtFormat = cleanKey.split(".").length === 3;

if (!isApiKeyFormat && !isJwtFormat) {
  console.error("❌ Service key format is invalid (not JWT and not sb_* API key)");
  console.error(`   Key length: ${cleanKey.length}`);
  process.exit(1);
}

if (isJwtFormat) {
  try {
    const payload = JSON.parse(
      
    );
    const refFromUrl = cleanUrl
      .replace(/^https?:\/\//, "")
      .split(".")[0];

    if (payload.ref && payload.ref !== refFromUrl) {
      console.error("❌ Service key and URL belong to different projects");
      console.error(`   URL project: ${refFromUrl}`);
      console.error(`   Key project: ${payload.ref}`);
      process.exit(1);
    }
  } catch {
    console.error("❌ Could not parse JWT payload from service key");
    process.exit(1);
  }
}

// supabase-js sends Authorization: Bearer <apikey>; that breaks for sb_* keys on some Storage setups
const fetchWithoutBearerForApiKeys = async (url, options = {}) => {
  if (!isApiKeyFormat) return fetch(url, options);

  const headers = new Headers(options.headers || {});
  const authHeader = headers.get("Authorization") || headers.get("authorization");
  if (authHeader === `Bearer ${cleanKey}`) {
    headers.delete("Authorization");
    headers.delete("authorization");
  }

  return fetch(url, { ...options, headers });
};

const newSupabase = createClient(cleanUrl, cleanKey, {
  global: { fetch: fetchWithoutBearerForApiKeys },
});

// Public buckets with direct download URLs
const PUBLIC_FILES = {
  "email-assets": [
    "studentresor-logo-ocean.svg",
    "studentresor-logo.svg",
  ],
  "trip-images": [
    "30255847-b094-434d-8eab-fe70dc1acd74/1770938427343-0.jpg",
    "30255847-b094-434d-8eab-fe70dc1acd74/1770938427848-1.jpg",
    "30255847-b094-434d-8eab-fe70dc1acd74/1770938428168-2.jpg",
    "30255847-b094-434d-8eab-fe70dc1acd74/1770938428512-3.jpg",
    "30255847-b094-434d-8eab-fe70dc1acd74/1770938428759-4.jpg",
    "30255847-b094-434d-8eab-fe70dc1acd74/1770938429025-5.jpg",
    "597039f7-a979-4638-bbb0-21a84c7e2f28/1770987272606-0.jpg",
    "597039f7-a979-4638-bbb0-21a84c7e2f28/1770987833038-0.jpg",
    "597039f7-a979-4638-bbb0-21a84c7e2f28/1770987834373-1.jpg",
    "597039f7-a979-4638-bbb0-21a84c7e2f28/1770987834734-2.jpg",
    "597039f7-a979-4638-bbb0-21a84c7e2f28/1770987835122-3.jpg",
    "597039f7-a979-4638-bbb0-21a84c7e2f28/1770987835419-4.jpg",
    "597039f7-a979-4638-bbb0-21a84c7e2f28/1770987835735-5.jpg",
    "597039f7-a979-4638-bbb0-21a84c7e2f28/1770987836006-6.jpg",
    "597039f7-a979-4638-bbb0-21a84c7e2f28/1770987836305-7.jpg",
    "5f3be006-2c09-4fba-aa6b-52e008264726/1770990199840-0.png",
    "7a25617d-8003-4769-8e73-91c1a5466f51.png",
    "a8984007-82e8-4562-b586-4a4cd43221a4/1772065431694-0.jpg",
    "a8984007-82e8-4562-b586-4a4cd43221a4/1772065465893-0.jpg",
    "a8984007-82e8-4562-b586-4a4cd43221a4/1772065466390-1.jpg",
    "a8984007-82e8-4562-b586-4a4cd43221a4/1772065466773-2.jpg",
    "a8984007-82e8-4562-b586-4a4cd43221a4/1772065467129-3.jpg",
    "a8984007-82e8-4562-b586-4a4cd43221a4/1772065467533-4.jpg",
    "a8984007-82e8-4562-b586-4a4cd43221a4/1772065467849-5.jpg",
    "a8984007-82e8-4562-b586-4a4cd43221a4/1772065468227-6.jpg",
    "a8984007-82e8-4562-b586-4a4cd43221a4/1772065468640-7.jpg",
    "ffc931ce-1c66-4b5a-a42e-ea75ef58e7d8/1769898906174-0.jpg",
    "ffc931ce-1c66-4b5a-a42e-ea75ef58e7d8/1769898907265-1.jpg",
    "ffc931ce-1c66-4b5a-a42e-ea75ef58e7d8/1769898908038-2.jpg",
    "ffc931ce-1c66-4b5a-a42e-ea75ef58e7d8/1769898908681-3.jpg",
    "ffc931ce-1c66-4b5a-a42e-ea75ef58e7d8/1769898909418-4.jpg",
    "ffc931ce-1c66-4b5a-a42e-ea75ef58e7d8/1769898910160-5.jpg",
  ],
  "partner-listing-images": [
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772585655625-0.jpg",
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772585656585-1.jpg",
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772585657507-2.jpg",
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772585657976-3.jpg",
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772585658530-4.jpg",
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772990057137-0.jpg",
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772990064375-1.jpg",
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772990072682-2.jpg",
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772990073337-3.jpg",
    "d89251ed-ba8a-4017-9698-2f33c876e1c8/1772990074218-4.png",
  ],
};

// Template images in trip-images bucket
const TEMPLATE_FILES = [
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240594913-0.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240595672-1.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240596054-2.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240596466-3.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240596875-4.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240597387-5.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240597798-6.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240598183-7.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240598519-8.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240599026-9.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240599435-10.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240599817-11.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240600767-12.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240601061-13.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240601305-14.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240601542-15.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240601933-16.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240602265-17.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240602590-18.jpg",
  "templates/073cf9ad-f25f-4433-874a-34701684c9ef/1772240602878-19.jpg",
];

// Add template files to trip-images
PUBLIC_FILES["trip-images"].push(...TEMPLATE_FILES);

// Bucket configs for creation
const BUCKET_CONFIGS = [
  { name: "trip-images", public: true },
  { name: "email-assets", public: true },
  { name: "partner-listing-images", public: true },
  { name: "booking-attachments", public: false },
];

function getContentType(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
  };
  return types[ext] || "application/octet-stream";
}

async function ensureBuckets() {
  console.log("\n🪣 Creating buckets...\n");
  for (const config of BUCKET_CONFIGS) {
    const { data, error } = await newSupabase.storage.createBucket(config.name, {
      public: config.public,
    });
    if (error) {
      if (error.message?.includes("already exists")) {
        console.log(`  ✅ ${config.name} (already exists)`);
      } else {
        console.error(`  ❌ ${config.name}: ${error.message}`);
      }
    } else {
      console.log(`  ✅ ${config.name} (created, public: ${config.public})`);
    }
  }
}

async function migrateFile(bucket, filePath) {
  const url = `${OLD_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  ❌ Download failed: ${bucket}/${filePath} (${response.status})`);
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const contentType = getContentType(filePath);

    const { error } = await newSupabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`  ❌ Upload failed: ${bucket}/${filePath}: ${error.message}`);
      return false;
    }

    console.log(`  ✅ ${bucket}/${filePath}`);
    return true;
  } catch (err) {
    console.error(`  ❌ Error: ${bucket}/${filePath}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Storage Migration Script");
  console.log(`   From: ${OLD_SUPABASE_URL}`);
  console.log(`   To:   ${NEW_SUPABASE_URL}`);

  await ensureBuckets();

  let total = 0;
  let success = 0;

  for (const [bucket, files] of Object.entries(PUBLIC_FILES)) {
    console.log(`\n📦 Migrating ${bucket} (${files.length} files)...\n`);
    for (const file of files) {
      total++;
      if (await migrateFile(bucket, file)) {
        success++;
      }
    }
  }

  console.log(`\n✨ Migration complete: ${success}/${total} files migrated successfully`);
  
  console.log("\n⚠️  Note: booking-attachments (private bucket) contains 3 PDFs that");
  console.log("   cannot be downloaded via public URLs. You may need to migrate");
  console.log("   these manually or re-upload them in your admin panel.\n");
}

main().catch(console.error);
