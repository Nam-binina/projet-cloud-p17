<?php

namespace App\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class SearchBar extends Component
{
    public $filters;
    public $search;
    public $id;

    /**
     * Create a new component instance.
     */
    public function __construct($filters = [], $search = '', $id = null)
    {
        $this->filters = $filters;
        $this->search = $search;
        $this->id = $id ?? 'searchBar_' . uniqid();
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render()
    {
        return view('components.search-bar');
    }
}
