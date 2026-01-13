<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);

        return [
            'category_id' => Category::query()->inRandomOrder()->value('id') ?? Category::factory(),
            'name' => Str::title($name),
            'description' => $this->faker->paragraph(),
            'price' => $this->faker->randomFloat(2, 5, 2000),
            'is_active' => $this->faker->boolean(85),
            'published_at' => $this->faker->optional()->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
