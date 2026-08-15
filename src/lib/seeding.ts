import { db } from './firebase';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { staticHafalanMaterials } from '../data/hafalanData';

export async function seedHafalanMaterials() {
 // Seed Classes
 const classesSnapshot = await getDocs(collection(db, 'classes'));
 if (classesSnapshot.empty) {
 const batch = writeBatch(db);
 ['Utsman', 'Umar Bin Khattab'].forEach(name => {
 const ref = doc(collection(db, 'classes'));
 batch.set(ref, { name, createdAt: new Date().toISOString() });
 });
 await batch.commit();
 }

 const querySnapshot = await getDocs(collection(db, 'hafalan_materials'));
 if (!querySnapshot.empty) {
 console.log('Hafalan materials already exist, skipping seed.');
 return;
 }

 console.log('Seeding hafalan materials...');
 const batch = writeBatch(db);
 
 staticHafalanMaterials.forEach((material) => {
 const docRef = doc(collection(db, 'hafalan_materials'), material.id);
 batch.set(docRef, {
 ...material,
 createdAt: new Date().toISOString()
 });
 });

 await batch.commit();
 console.log('Successfully seeded hafalan materials.');
}

export async function seedInitialSettings() {
 const settingsRef = doc(db, 'settings', 'landingPage');
 const docSnap = await getDocs(collection(db, 'settings'));
 
 if (!docSnap.empty) return;

 await setDoc(settingsRef, {
 logoUrl: '',
 heroImageUrl: '',
 galleryImages: [],
 announcements: [],
 updatedAt: new Date().toISOString()
 });
}
