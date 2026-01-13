<nav aria-label="breadcrumb">
    <ol class="breadcrumb">
        @foreach($items as $key => $item)
            @if(isset($item['href']) && $key < count($items) - 1)
                <li class="breadcrumb-item">
                    <a href="{{ $item['href'] }}">{{ $item['label'] }}</a>
                </li>
            @else
                <li class="breadcrumb-item active" aria-current="page">
                    {{ $item['label'] }}
                </li>
            @endif
        @endforeach
    </ol>
</nav>
