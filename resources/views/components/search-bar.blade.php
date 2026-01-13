<div class="mb-2">
    <button id="toggleFilterBtn_{{ $id }}" class="btn btn-info" type="button">
        Afficher les filtres <i class="fas fa-chevron-down"></i>
    </button>
</div>

<form id="form_{{ $id }}" class="form-inline mb-3" action="{{ $search }}" style="display: none;">
    <div class="input-group mb-2 mr-2">
        <input type="text" name="search" class="form-control" placeholder="Rechercher..." id="input_{{ $id }}" value="{{ request('search') }}">
    </div>

    @isset($filters)
        @foreach($filters as $filter)
            <div class="mb-2 mr-2">
                <select name="{{ $filter['name'] }}" class="form-control">
                    <option value="">{{ $filter['label'] }}</option>
                    @foreach($filter['options'] as $value => $label)
                        <option value="{{ $value }}" {{ request($filter['name']) == $value ? 'selected' : '' }}>
                            {{ $label }}
                        </option>
                    @endforeach
                </select>
            </div>
        @endforeach
    @endisset

    <div class="mb-2">
        <button class="btn btn-primary" type="submit">
            Appliquer le filtre <i class="fas fa-search"></i>
        </button>
    </div>
</form>

<script>
    document.getElementById('toggleFilterBtn_{{ $id }}').addEventListener('click', function() {
        var form = document.getElementById('form_{{ $id }}');
        if (form.style.display === 'none' || form.style.display === '') {
            form.style.display = 'flex';
            form.style.flexWrap = 'wrap';
        } else {
            form.style.display = 'none';
        }
    });
</script>
