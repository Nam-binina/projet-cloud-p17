<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Technologie',
                'slug' => 'technologie',
                'description' => 'Articles sur la technologie et l\'innovation',
                'is_active' => true
            ],
            [
                'name' => 'Science',
                'slug' => 'science',
                'description' => 'Découvertes scientifiques et recherches',
                'is_active' => true
            ],
            [
                'name' => 'Sport',
                'slug' => 'sport',
                'description' => 'Actualités sportives',
                'is_active' => true
            ],
            [
                'name' => 'Culture',
                'slug' => 'culture',
                'description' => 'Arts, musique et culture',
                'is_active' => true
            ],
            [
                'name' => 'Économie',
                'slug' => 'economie',
                'description' => 'Actualités économiques et financières',
                'is_active' => true
            ]
        ];
        
        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
