<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ProductController extends Controller
{

    public function destroy(int $idProduit)
    {
        $product = Product::findOrFail($idProduit);

        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Le produit a été supprimé avec succès.');
    }
    public function applyModif(StoreProductRequest $request, int $idProduits)
    {
        $product = Product::findOrFail($idProduits);

        $data = $request->validated();

        $data['is_active'] = $request->has('is_active');

        $product->update($data);

        return redirect()->route('products.index')
            ->with('success', 'Le produit a été mis à jour avec succès.');
    }

    public function edit(int $idProduct)
    {
        $product = Product::findOrFail($idProduct);

        $categories = Category::all();

        return view('product.form', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    public function form()
    {
        $category = Category::all();
        return view('product.form', ['categories' => $category]);
    }

    public function details(int $idProduits)
    {
        $product = Product::findOrFail($idProduits);
        return view('product.details', ['product' => $product]);
    }

    public function save(StoreProductRequest $request)
    {
        $data = $request->validated();

        $products = Product::create($data);

        return redirect()->route('products.index')->with('success', 'Produit créé avec succès.');
    }

    public function index(Request $request): View
    {
        $perPage = (int) $request->input('per_page', 10);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');

        $allowedSorts = ['id', 'name', 'price', 'is_active', 'published_at', 'created_at', 'category_id'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'created_at';
        }

        $query = Product::with('category'); 

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }
        if ($request->filled('category')) {
            $query->where('category_id', $request->input('category'));
        }

        $products = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return view('product.index', [
            'products' => $products,
            'categories' => Category::all(),
            'sort' => $sort,
            'direction' => $direction,
        ]);
    }
}
