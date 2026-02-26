<?php

namespace App\Console\Commands;

use App\Models\Site;
use App\Models\Page;
use App\Models\Branch;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ImportCeisaDocs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:ceisa {file=ceisa_tiptap.json}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import scraped CEISA 4.0 GitBook documentation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $file = $this->argument('file');
        
        if (!file_exists($file)) {
            $this->error("File {$file} not found!");
            return 1;
        }

        $data = json_decode(file_get_contents($file), true);
        if (!$data) {
            $this->error("Failed to parse JSON.");
            return 1;
        }

        $user = \App\Models\User::first();
        if (!$user) {
            $this->error("No user found in default database.");
            return 1;
        }

        // Create Site
        $site = Site::firstOrCreate(
            ['slug' => 'ceisa-40-official'],
            [
                'name' => 'CEISA 4.0 Official',
                'description' => 'Imported User Manual from GitBook portal-ceisa40',
                'is_published' => false,
                'user_id' => $user->id
            ]
        );

        $branch = $site->branches()->where('is_default', true)->first();
        if (!$branch) {
            $branch = $site->branches()->create([
                'name' => 'main',
                'is_default' => true
            ]);
        }

        $this->info("Site created/found: {$site->name}");
        $this->info("Total pages to import: " . count($data));

        $pathMap = []; // Stores path => Page Model

        // Sort data by path length (number of slashes) to ensure parents are created before children
        usort($data, function($a, $b) {
            return count($a['parts']) <=> count($b['parts']);
        });

        $orderCounter = [];

        foreach ($data as $item) {
            $path = $item['path'];
            $parts = $item['parts'];
            $title = $item['title'];
            $content = $item['content'];

            // Find parent
            $parentId = null;
            if (count($parts) > 1) {
                // Parent path is all parts except the last one
                $parentParts = array_slice($parts, 0, -1);
                $parentPath = '/' . implode('/', $parentParts);
                
                if (isset($pathMap[$parentPath])) {
                    $parentId = $pathMap[$parentPath]->id;
                }
            }

            // Track ordering for siblings
            $orderKey = $parentId ?: 'root';
            if (!isset($orderCounter[$orderKey])) {
                $orderCounter[$orderKey] = 0;
            }
            $orderCounter[$orderKey]++;

            $page = Page::create([
                'site_id' => $site->id,
                'branch_id' => $branch->id,
                'parent_id' => $parentId,
                'title' => $title,
                'content' => $content,
                'order' => $orderCounter[$orderKey],
                'logical_id' => Str::uuid(),
            ]);

            $pathMap[$path] = $page;
            $this->info("Imported: {$title} ({$path})");
        }

        $this->info("Import successfully finished!");
        return 0;
    }
}
