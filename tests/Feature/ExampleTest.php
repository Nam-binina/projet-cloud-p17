<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_homepage_redirects_to_categories(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/categories');

        $this->followingRedirects()
            ->get('/')
            ->assertSee('Liste des catégories');
    }
}
