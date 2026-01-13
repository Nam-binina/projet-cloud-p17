<?php

namespace App\View\Components\Ui;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class Breadcrumb extends Component
{
    public array $items;

    /**
     * @param array $items Liste de liens : [['label'=>'Accueil','href'=>'/'], ...]
     */
    public function __construct(array $items = [])
    {
        $this->items = $items;
    }

    public function render()
    {
        return view('components.ui.breadcrumb');
    }
}
