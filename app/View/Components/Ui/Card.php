<?php

namespace App\View\Components\Ui;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class Card extends Component
{
    public ?string $title;
    public ?string $footer;
    public ?string $class;

    public function __construct(?string $title = null, ?string $footer = null, ?string $class = null)
    {
        $this->title = $title;
        $this->footer = $footer;
        $this->class = $class;
    }

    public function render()
    {
        return view('components.ui.card');
    }
}
