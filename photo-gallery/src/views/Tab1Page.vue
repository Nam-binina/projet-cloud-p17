<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonImg, IonFab, IonFabButton, IonIcon
} from '@ionic/vue';
import { camera } from 'ionicons/icons';
import { useFirestore, useCollection } from 'vuefire';
import { collection, addDoc, orderBy, query } from 'firebase/firestore';

const db = useFirestore();
const photos = useCollection(collection(db, 'photos'));

const takePhoto = async () => {
  console.log("Ouverture de la camera...");
  
}

</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Gallery photo</ion-title>
      </ion-toolbar>
    </ion-header>
  </ion-page>
</template>