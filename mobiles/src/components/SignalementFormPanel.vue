<template>
  <div class="form" v-if="show">
    <h3>Nouveau signalement</h3>
    <ion-item>
      <ion-label>Statut</ion-label>
      <ion-select v-model="localForm.statut">
        <ion-select-option value="nouveau">Nouveau</ion-select-option>
        <ion-select-option value="en_cours">En cours</ion-select-option>
        <ion-select-option value="termine">Termine</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Description</ion-label>
      <ion-input v-model="localForm.description" placeholder="Decrivez le probleme"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Entreprise concernée</ion-label>
      <ion-input v-model="localForm.entreprise" placeholder="Nom de l'entreprise"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Surface (m²)</ion-label>
      <ion-input type="number" v-model.number="localForm.surface" placeholder="Ex: 10"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Budget (Ar)</ion-label>
      <ion-input type="number" v-model.number="localForm.budget" placeholder="Ex: 100000"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label>Photos</ion-label>
      <input class="photo-input" type="file" multiple accept="image/*" @change="onFilesChange" />
    </ion-item>

    <ion-button expand="block" color="success" @click="$emit('submit')">
      Valider
    </ion-button>
    <ion-button expand="block" color="medium" @click="$emit('cancel')">
      Annuler
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';

type FormState = {
  statut: string;
  description: string;
  entreprise: string;
  surface: number;
  budget: number;
};

const props = defineProps<{
  show: boolean;
  form: FormState;
}>();

const emit = defineEmits(['update:form', 'submit', 'cancel', 'update:photos']);

const localForm = reactive<FormState>({ ...props.form });

watch(() => props.form, (val) => {
  Object.assign(localForm, val);
}, { deep: true });

watch(localForm, (val) => {
  emit('update:form', { ...val });
}, { deep: true });

function onFilesChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const files = target?.files ? Array.from(target.files) : [];
  emit('update:photos', files);
}
</script>

<style scoped>
.form {
  width: 350px;
  flex-shrink: 0;
  background: #ffffff;
  border-left: 1px solid #ddd;
  padding: 16px;
  overflow-y: auto;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .form {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100% !important;
    max-height: 55vh;
    border-left: none;
    border-top: 2px solid #ddd;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
    z-index: 600;
    padding: 14px 16px;
  }
}

.form h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.form ion-item {
  margin-bottom: 12px;
}

.form ion-button {
  margin-top: 8px;
}

.photo-input {
  width: 100%;
  font-size: 12px;
}
</style>
