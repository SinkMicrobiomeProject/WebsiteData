Sink Microbiome Project Ñ Pipeline & Website Update Instructions
Overview                                                                                                                                                                  
This document walks through how to add new sequencing data, rerun the analysis pipeline, and push updated results to the live website.                                                                                   
Repository: https://github.com/SinkMicrobiomeProject/WebsiteData
  ---
  Step 1: Prepare Your New Data Files
  You need two files from your QIIME2 / bioinformatics workflow:
  A. OTU/ASV Table (otu-table-w-taxonomy.txt)
 Tab-separated file with taxonomy as row names and sample IDs as columns.
  Format:
  # Constructed from biom file
  #OTU ID       34_1_P  34_1_Y  12_P    12_Y    ...
  d__Bacteria;p__Pseudomonadota;...;g__Acinetobacter;s__...     935     248212  0       33928   ...

  - First column: full taxonomy string (semicolon-separated, domain through species)
  - Remaining columns: read counts per sample
  - Sample IDs follow the pattern: {kit_id}_{P or Y} where P = tail piece (drain), Y = countertop
  - For kits with multiple timepoints: {kit_id}_{timepoint}_{P or Y} (e.g., 34_1_P, 34_2_P)

  B. Metadata (metadata.txt)
  Tab-separated file with sample information.
  Required columns:
  Sample ID     Kit ID  sample_location Zipcode County
  12_P  12      Tail piece      27603   Wake
  12_Y  12      Countertop      27603   Wake

  - Sample ID: must match column names in the OTU table
  - Kit ID: numeric kit identifier
  - sample_location: "Tail piece" or "Countertop"
  - Zipcode: participant zip code
  - County: NC county name (no "County" suffix)

  C. Functional Guilds Reference (functional_guilds_reference.csv)

  This file rarely changes. Only update it if you need to add new genera.

  ---
  Step 2: Update Data on GitHub

  Option A: Via Terminal (Recommended)

  Open Terminal and run:

  # 1. Navigate to the repo
  cd /Users/megan/Desktop/Premier/Public_Science/Sink_Microbiome_Project/SeqData_TestRun_Dec2025/claude_analysis

  # 2. Make sure you're on the main branch and up to date
  git checkout main
  git pull origin main

  # 3. Replace the data files with your new versions
  #    Copy your new files into the data/ folder, for example:
  cp /path/to/your/new/otu-table-w-taxonomy.txt data/otu-table-w-taxonomy.txt
  cp /path/to/your/new/metadata.txt data/metadata.txt

  # 4. Stage, commit, and push
  git add data/otu-table-w-taxonomy.txt data/metadata.txt
  git commit -m "Update data with new sequencing batch [Month Year]"
  git push origin main

  Option B: Via GitHub.com

  1. Go to https://github.com/SinkMicrobiomeProject/WebsiteData
  2. Navigate to the data/ folder
  3. Click "Add file" > "Upload files"
  4. Drag in your new otu-table-w-taxonomy.txt and metadata.txt
  5. Write a commit message and click "Commit changes"

  Note: Pushing new files to data/ on the main branch will automatically trigger the GitHub Actions pipeline (see
   Step 3B).

  ---
  Step 3: Run the Analysis Pipeline

  Option A: Run Locally

  Open Terminal and run:

  # Navigate to the scripts directory
  cd /Users/megan/Desktop/Premier/Public_Science/Sink_Microbiome_Project/SeqData_TestRun_Dec2025/claude_analysis/
  scripts

  # Run the full pipeline
  Rscript run_pipeline.R

  This will regenerate all JSON files in output/. Then push the results:

  cd /Users/megan/Desktop/Premier/Public_Science/Sink_Microbiome_Project/SeqData_TestRun_Dec2025/claude_analysis

  git add output/
  git commit -m "Update analysis results - $(date +'%Y-%m-%d')"
  git push origin main

  Option B: Let GitHub Actions Run It Automatically

  The pipeline runs automatically when:
  - You push changes to data/ files (triggered by Step 2)
  - On the 1st of every month at 6:00 AM UTC
  - You manually trigger it

  To manually trigger:
  1. Go to https://github.com/SinkMicrobiomeProject/WebsiteData/actions
  2. Click "Update Sink Microbiome Analysis" in the left sidebar
  3. Click "Run workflow" > "Run workflow"
  4. Wait for the green checkmark (takes ~5 minutes)

  GitHub Actions will automatically commit the updated output/ files back to the repo.

  ---
  Step 4: Deploy to the Website

  Option A: GitHub Pages (Free, Simple)

  One-time setup:
  1. Go to https://github.com/SinkMicrobiomeProject/WebsiteData/settings/pages
  2. Under "Source", select "Deploy from a branch"
  3. Set branch to main, folder to / (root)
  4. Click "Save"

  Your site will be live at:
  https://sinkmicrobiomeproject.github.io/WebsiteData/website/index.html

  After initial setup, every push to main automatically updates the live site.

  Option B: Custom Domain (e.g., sinkmicrobiome.com)

  If you own a domain like sinkmicrobiome.com, you can point it to GitHub Pages:

  1. Configure GitHub Pages (same as Option A above)

  2. Add a CNAME file to the repo:
  cd /Users/megan/Desktop/Premier/Public_Science/Sink_Microbiome_Project/SeqData_TestRun_Dec2025/claude_analysis

  echo "sinkmicrobiome.com" > CNAME
  git add CNAME
  git commit -m "Add custom domain"
  git push origin main

  3. Configure DNS at your domain registrar:

  Add these DNS records at whichever service you purchased the domain from (e.g., Namecheap, Google Domains,
  GoDaddy):
  ???????????????????????????????????????????????????????
  ? Type  ? Host/Name ?              Value              ?
  ???????????????????????????????????????????????????????
  ? A     ? @         ? 185.199.108.153                 ?
  ???????????????????????????????????????????????????????
  ? A     ? @         ? 185.199.109.153                 ?
  ???????????????????????????????????????????????????????
  ? A     ? @         ? 185.199.110.153                 ?
  ???????????????????????????????????????????????????????
  ? A     ? @         ? 185.199.111.153                 ?
  ???????????????????????????????????????????????????????
  ? CNAME ? www       ? sinkmicrobiomeproject.github.io ?
  ???????????????????????????????????????????????????????
  4. Enable HTTPS:
  1. Go to https://github.com/SinkMicrobiomeProject/WebsiteData/settings/pages
  2. Under "Custom domain", enter sinkmicrobiome.com and click Save
  3. Check "Enforce HTTPS" (may take a few minutes to become available)

  Your site will then be live at:
  https://sinkmicrobiome.com/website/index.html

  ---
  Step 5: Preview Locally Before Pushing

  To test changes before they go live:

  # Navigate to the repo root
  cd /Users/megan/Desktop/Premier/Public_Science/Sink_Microbiome_Project/SeqData_TestRun_Dec2025/claude_analysis

  # Start a local web server
  python3 -m http.server 8080

  # Open in browser:
  #   http://localhost:8080/website/index.html
  #   http://localhost:8080/website/participant.html?kit=12

  # Press Ctrl+C in Terminal to stop the server when done

  ---
  Quick Reference: Full Update Workflow

  # 1. Pull latest
  cd /Users/megan/Desktop/Premier/Public_Science/Sink_Microbiome_Project/SeqData_TestRun_Dec2025/claude_analysis
  git pull origin main

  # 2. Replace data files
  cp /path/to/new/otu-table-w-taxonomy.txt data/
  cp /path/to/new/metadata.txt data/

  # 3. Run pipeline locally
  cd scripts && Rscript run_pipeline.R && cd ..

  # 4. Preview locally
  python3 -m http.server 8080
  # Check http://localhost:8080/website/index.html in browser
  # Ctrl+C to stop server

  # 5. Push everything
  git add data/ output/
  git commit -m "Update data and results - $(date +'%Y-%m-%d')"
  git push origin main

  ---
  Troubleshooting
  Problem: Pipeline fails with rarefaction error
  Solution: Your new samples may have fewer than 100,000 reads. Edit RAREFACTION_DEPTH in scripts/00_config.R
  ????????????????????????????????????????
  Problem: Website shows no data
  Solution: Open browser console (Cmd+Option+J) to check for errors. Verify JSON files exist in output/
  ????????????????????????????????????????
  Problem: GitHub Actions fails
  Solution: Check the Actions tab for error logs. Usually a missing R package or malformed data file
  ????????????????????????????????????????
  Problem: git push is rejected
  Solution: Run git pull origin main first to sync, then push again
  ????????????????????????????????????????
  Problem: Page shows "kit does not exist"
  Solution: Make sure participant.html still has <input type="hidden" id="form-kit-id" value=""> in the HTML
