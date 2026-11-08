"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stepper } from './Stepper';
import { PLANS, SERVICE_NAME_KEYS } from './plans';
import { OPTION_CARDS } from './plans';

const STEPS = ['Profil', 'Entreprise', 'Services', 'KYC', 'Paiement'];

// Mapping dynamique des champs par service
const FORM_FIELDS = {
  creation: ['formeJuridique', 'capital', 'associes', 'dirigeant'],
  oapi: ['typeActif', 'nomMarque', 'classes', 'description'],
  fiscalite: ['regime', 'centreImpots', 'acf', 'declarations'],
  contrats: ['typeContrat', 'cocontractant', 'langue'],
  recouvrement: ['montant', 'nbDebiteurs', 'nature', 'historique'],
};

export default function Abonnement() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Persistance sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('abonnement_data');
    if (saved) setFormData(JSON.parse(saved));
  }, []);
  useEffect(() => {
    sessionStorage.setItem('abonnement_data', JSON.stringify(formData));
  }, [formData]);

  const updateData = (newData: any) => setFormData((prev: any) => ({ ...prev, ...newData }));

  // Navigation
  const nextStep = () => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1));
  const prevStep = () => setCurrentStep(prev => Math.max(0, prev - 1));

  // Auth & Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  useEffect(() => {
    const isVerified = false; // placeholder vérification backend
    if (!isVerified) setShowEmailModal(true);
  }, []);

  const handleEmailNoThanks = () => {
    const svc = selectedService || 'domiciliation';
    router.push(`/${svc}`);
    setShowEmailModal(false);
  };
  const handleEmailVerify = () => setShowEmailModal(false);

  return (
    <div style={{padding:'2rem', maxWidth:'800px', margin:'auto'}}>
      {showEmailModal && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, bottom:0,
          background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center',
          alignItems:'center', zIndex:9999
        }}>
          <div style={{
            background:'#fff', padding:'2rem', borderRadius:'8px',
            maxWidth:'480px', textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <p><strong>Vérification de votre e-mail</strong></p>
            <p>Un e-mail de vérification a été envoyé.</p>
            <div style={{marginTop:'1.5rem',display:'flex',gap:'1rem'}}>
              <button className="btn btn-primary" onClick={handleEmailVerify}>Vérifier</button>
              <button className="btn btn-outline" onClick={handleEmailNoThanks}>Non merci</button>
            </div>
          </div>
        </div>
      )}

      <Stepper currentStep={currentStep} totalSteps={STEPS.length} labels={STEPS} />

      {/* Étape 1: Profil (identique) */}
      {currentStep === 0 && (
        <div>
          <h2>Étape 1 : Profil</h2>
          <p>Nom, email, téléphone...</p>
          <button className="btn btn-primary" onClick={nextStep}>Suivant</button>
        </div>
      )}

      {/* Étape 2: Service + Détails (Dynamique) */}
      {currentStep === 1 && (
        <div>
          <h2>Étape 2 : Sélection du Service</h2>
          <select value={selectedService || ''} onChange={e => setSelectedService(e.target.value)}>
            <option value="">-- Choisir --</option>
            {Object.keys(FORM_FIELDS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={nextStep} disabled={!selectedService}>Suivant</button>
        </div>
      )}

      {/* Étape 3: Détails spécifiques (Dynamique selon FORM_FIELDS) */}
      {currentStep === 2 && selectedService && (
        <div>
          <h2>Étape 3 : Détails de {selectedService}</h2>
          {FORM_FIELDS[selectedService as keyof typeof FORM_FIELDS].map(field => (
            <div key={field} className="form-group">
              <label>{field}</label>
              <input type="text" value={formData[field] || ''} onChange={e => updateData({[field]: e.target.value})} />
            </div>
          ))}
          <button className="btn btn-primary" onClick={nextStep}>Suivant</button>
        </div>
      )}

      {/* Étape 4: KYC (standard) */}
      {currentStep === 3 && (
        <div>
          <h2>Étape 4 : KYC & Documents</h2>
          <p>Téléchargez vos justificatifs.</p>
          {formData.kycDejaFait === true ? (
            <div style={{margin:'1rem 0',padding:'0.5rem',background:'#d4edda'}}>
              <span>✓ KYC déjà complété</span>
            </div>
          ) : (
            <div>
              <input type="file" accept="image/*,.pdf" onChange={e => updateData({idFile:e.target.files[0]})} />
              <input type="file" accept=".pdf" onChange={e => updateData({statutesFile:e.target.files[0]})} />
              <input type="file" accept="image/*,.pdf" onChange={e => updateData({domicileFile:e.target.files[0]})} />
            </div>
          )}
          <button className="btn btn-primary" onClick={nextStep}>Suivant</button>
        </div>
      )}

      {/* Étape 5: Récap & Paiement */}
      {currentStep === 4 && (
        <div>
          <h2>Étape 5 : Récapitulatif & Paiement</h2>
          <div style={{margin:'1rem 0',padding:'0.5rem',background:'#f8f9fa'}}>
            <strong>Service :</strong> {selectedService||'Non sélectionné'}<br />
            <strong>Total :</strong> {formData.total||'À calculer'} FCFA
          </div>
          <div style={{margin:'1.5rem 0'}}>
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.chkCgv} onChange={e=>updateData({chkCgv:e.target.checked})}/> J'accepte les CGV
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.chkCadre} onChange={e=>updateData({chkCadre:e.target.checked})}/> J'accepte le Cadre Contractuel
            </label>
          </div>
          <button className="btn btn-primary btn-block" onClick={()=>{/* submit */}} disabled={!formData.chkCgv||!formData.chkCadre}>
            Payer {formData.total||0} FCFA
          </button>
          <button className="btn btn-outline" onClick={()=>prevStep()}>Modifier</button>
        </div>
      )}
    </div>
  );
}