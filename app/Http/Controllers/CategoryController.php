<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CategoryController extends Controller
{

    
    public function create(Request $request): RedirectResponse
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'required|string',
            'slug' => 'required|string'
        ]);

        try {
            $category = new Category();
            $category->name = $request->input('nom');
            $category->description = $request->input('description');
            $category->slug = $request->input('slug');
            $category->save();
        } catch (\Throwable $th) {
            return back()->withErrors('Impossible de créer la catégorie.' . $th->getMessage());
        }

        return redirect('/categories')->with('success', 'Catégorie créée avec succès !');
    }


    public function createForm()
    {
        return view('category.form');
    }

    public function editForm(int $idCategorie)
    {
        $category = Category::find($idCategorie);
        return view('category.form', ['category' => $category]);
    }

    public function delete(int $idCategorie){
        $category = Category::findOrFail($idCategorie);
        try {
            $category->delete();
        } catch (\Throwable $th) {
            //throw $th;
        }
        return redirect('/categories');
    }

    public function edit(Request $request, int $idCategorie)
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'required|string',
            'slug' => 'required|string'
        ]);

        $category = Category::findOrFail($idCategorie);
        try {
            $category->name = $request->input('nom');
            $category->description = $request->input('description');
            $category->slug = $request->input('slug');
            $category->save();
        } catch (\Throwable $th) {
            return back()->withErrors('Impossible de modifier la categorie.' . $th->getMessage());
        }

        return redirect('/categories')->with('success', 'Catégorie créée avec succès !');
    }

    public function details(int $idCategorie)
    {
        $category = Category::find($idCategorie);
        return view('category.details', ['category' => $category]);
    }

    public function listAll(): View
    {
        $categories = Category::withCount('products')->get();
        return view('category.list', ['categories' => $categories]);
    }
}
