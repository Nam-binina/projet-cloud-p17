<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Documentation Font Awesome Offline</title>

    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        #search { padding: 10px; width: 300px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
        .icon-card { border: 1px solid #ccc; padding: 15px; border-radius: 8px; text-align: center; }
        svg { width: 32px; height: 32px; margin-bottom: 10px; }
        .style { font-size: 12px; color: #666; }
    </style>
</head>

<body>

<h1>Font Awesome — Documentation Hors Ligne</h1>

<input id="search" type="text" placeholder="Rechercher une icône…">

<div class="grid" id="iconGrid">
    @foreach($icons as $icon)
        <div class="icon-card" data-name="{{ $icon['name'] }}">
            <div class="style">{{ $icon['style'] }}</div>
            <img src="{{ $icon['path'] }}" alt="{{ $icon['name'] }}">
            <div>{{ $icon['name'] }}</div>
            <small>fa-{{ $icon['name'] }}</small>
        </div>
    @endforeach
</div>

<script>
    const search = document.getElementById('search');
    const cards = document.querySelectorAll('.icon-card');

    search.addEventListener('keyup', function () {
        const query = this.value.toLowerCase();

        cards.forEach(card => {
            const name = card.dataset.name.toLowerCase();
            card.style.display = name.includes(query) ? 'block' : 'none';
        });
    });
</script>

</body>
</html>
