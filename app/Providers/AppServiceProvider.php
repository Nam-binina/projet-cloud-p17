<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // $this->mergeConfigFrom(__DIR__ . '/../../config/laravel-bootstrap-components.php', 'laravel-bootstrap-components');
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
    }
}
