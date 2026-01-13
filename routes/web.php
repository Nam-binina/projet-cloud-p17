<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DevController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use App\Models\Category;

// Route::get('/', function () {
//     return view('welcome');
// });

Route::redirect('/','/categories');

Route::prefix('dev')->group(function(){
    Route::get('/fa-icons',[DevController::class,'listIcons']);
});

Route::prefix('user')->group(function(){
    Route::get('/login',[UserController::class,'loginPage']);
});

Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'listAll']);
    Route::get('/details/{id}', [CategoryController::class, 'details']);
    Route::get('/form', [CategoryController::class, 'createForm']);
    Route::get('/modifier/{id}', [CategoryController::class, 'editForm']);
    Route::post('/modifier/{id}', [CategoryController::class, 'edit']);
    Route::post('/supprimer/{id}', [CategoryController::class, 'delete']);
    Route::post('/', [CategoryController::class, 'create']);
});

Route::prefix('products')->group(function(){
    Route::get('/',[ProductController::class,'index'])->name('products.index');
    Route::get('/form',[ProductController::class,'form'])->name('products.form');
    Route::post('/',[ProductController::class,'save'])->name('products.store');
    Route::get('/details/{id}',[ProductController::class,'details'])->name('products.details');
    Route::get('/edit/{id}',[ProductController::class,'edit'])->name('products.edit');
    Route::delete('/destroy/{id}',[ProductController::class,'destroy'])->name('products.destroy');
    Route::put('/update/{id}',[ProductController::class,'applyModif'])->name('products.update');
});


// Route::get('/categories', function () {
//     $categories = Category::all();
//     return view('categories', ['categories' => $categories]);
// });
