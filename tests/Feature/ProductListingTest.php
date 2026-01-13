<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductListingTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_displays_paginated_products(): void
    {
        Category::factory()->count(3)->create();
        Product::factory()->count(15)->create();

        $response = $this->get('/products');

        $response->assertStatus(200);
        $response->assertSee('Catalogue produits');
        $response->assertSee('SKU');

        // Ensure pagination chunked (default 10 per page)
        $response->assertSee('Affiche 1–10');
    }
}
