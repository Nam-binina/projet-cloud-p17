<?php

namespace App\Http\Controllers;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class DevController extends Controller
{
    public function listIcons(): View
    {
        $basePath = public_path('vendor/fontawesome-free/svgs');

        $icons = [];

        foreach (['solid', 'regular', 'brands'] as $style) {

            $path = $basePath . '/' . $style;

            if (!File::exists($path)) {
                continue;
            }

            foreach (File::files($path) as $file) {
                $icons[] = [
                    'name' => pathinfo($file->getFilename(), PATHINFO_FILENAME),
                    'style' => $style,
                    'path' => asset("vendor/fontawesome/svgs/$style/" . $file->getFilename())
                ];
            }
        }

        sort($icons);

        return view('dev.fa.icons', compact('icons'));
    }
}
