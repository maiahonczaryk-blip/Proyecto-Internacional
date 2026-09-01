/* ============================================================
   RE/MAX Inmomás — Referral Agreement Word Generator
   ============================================================
   Generates a downloadable .doc file (MS Word compatible)
   with the Broker's data AND the Referring Agent's name & email.
   One agreement per broker-agent pair (no Annex).
   ============================================================ */

;(function() {
  'use strict';

  window.App = window.App || {};

  /**
   * generateReferralAgreementDoc(userData)
   * Creates and downloads a Word-compatible .doc file with
   * the Master Referral Agreement pre-filled with user data.
   * @param {Object} userData - Current user profile object
   */
  App.generateReferralAgreementDoc = function(userData, agentData) {
    const user       = userData || App.auth.getCurrentUser() || {};
    const agent      = agentData || {};
    const fullName   = `${user.firstName || ''} ${user.lastName || ''}`.trim() || '___________________';
    const agency     = user.agencyName || user.brokerNameManual || '___________________';
    const email      = user.email || '___________________';
    const phone      = user.phone || '___________________';
    const country    = user.country || 'United States / Canada';
    // Agent fields — if agentData is not provided, fall back to blank
    const agentName  = agent.firstName && agent.lastName
                         ? `${agent.firstName} ${agent.lastName}`.trim()
                         : (agent.name || '___________________');
    const agentEmail = agent.email || '___________________';
    const today      = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>Master Referral Agreement — RE/MAX Inmomás</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 2cm 2cm;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 10.5pt;
      color: #2c3e50;
      line-height: 1.5;
    }
    h1 { font-size: 16pt; color: #003da5; text-align: center; margin-bottom: 2pt; font-weight: bold; }
    h2 { font-size: 12pt; color: #e11b22; text-align: center; margin-bottom: 16pt; font-weight: 600; }
    h3 { font-size: 11pt; color: #003da5; font-weight: bold; margin-top: 16pt; margin-bottom: 6pt; border-bottom: 1.5pt solid #003da5; padding-bottom: 2pt; }
    .header-bar { 
      border-top: 4pt solid #e11b22;
      border-bottom: 2pt solid #003da5;
      padding: 12pt 0;
      margin-bottom: 24pt;
      text-align: center;
    }
    .header-bar h1 { color: #003da5; margin: 0; font-size: 18pt; letter-spacing: 0.5pt; }
    .header-bar p { color: #7f8c8d; margin: 4pt 0 0; font-size: 10pt; text-transform: uppercase; letter-spacing: 1pt; }
    .doc-ref { text-align: right; font-size: 9pt; color: #95a5a6; margin-bottom: 16pt; border-bottom: 1pt solid #ecf0f1; padding-bottom: 8pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20pt; }
    td, th { border: 1pt solid #bdc3c7; padding: 7pt 10pt; font-size: 10pt; vertical-align: middle; }
    th { background-color: #f4f6f9; color: #003da5; font-weight: bold; width: 32%; text-align: left; }
    .broker-title { font-size: 11pt; font-weight: bold; color: #ffffff; background: #003da5; padding: 7pt 12pt; margin-bottom: 0; border: 1pt solid #003da5; }
    .example-box { background: #f8f9fa; border-left: 3pt solid #e11b22; padding: 10pt 14pt; margin: 10pt 0; font-size: 10pt; color: #34495e; }
    .lang-divider { display: block; color: #7f8c8d; font-size: 9.5pt; font-style: italic; margin-top: 4pt; line-height: 1.4; }
    .clause { margin-bottom: 16pt; text-align: justify; }
    .signatures { margin-top: 40pt; page-break-inside: avoid; }
    .sig-field { font-size: 10pt; color: #2c3e50; margin: 4pt 0; }
    .sig-line { border-bottom: 1pt solid #2c3e50; margin: 24pt 0 4pt; width: 90%; }
    .footer { margin-top: 30pt; padding-top: 12pt; border-top: 1pt solid #ecf0f1; font-size: 8.5pt; color: #95a5a6; text-align: center; }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-bar">
    <img src="https://proyecto-internacional.vercel.app/LOGO_NUEVO_REMAX_Inmom%C3%A1s_RGB_AZUL-01.png" alt="RE/MAX Inmomás" style="height:60px;">
    <p>International Referral Division / División Internacional de Referidos</p>
  </div>

  <p style="text-align:center; margin-bottom:4pt;">
    <strong style="font-size:15pt; color:#003da5;">MASTER REFERRAL AGREEMENT</strong>
  </p>
  <p style="text-align:center; font-size:11pt; color:#e11b22; margin-bottom:6pt;">
    Acuerdo Marco de Colaboración y Referidos
  </p>
  <p class="doc-ref">
    Date / Fecha: <strong>${today}</strong> &nbsp;|&nbsp; Ref: INM-REF-${Date.now().toString().slice(-6)}
  </p>

  <!-- Broker Cards -->
  <table>
    <tr>
      <td style="width:50%; vertical-align:top; padding:0;">
        <div class="broker-title">Broker A — Referring Brokerage / Agencia Referente</div>
        <table style="margin-bottom:0; border-top:none;">
          <tr><th>Brokerage / Agencia</th><td>${App.utils ? App.utils.escapeHtml(agency) : agency}</td></tr>
          <tr><th>Broker of Record</th><td>${App.utils ? App.utils.escapeHtml(fullName) : fullName}</td></tr>
          <tr><th>Country / País</th><td>${App.utils ? App.utils.escapeHtml(country) : country}</td></tr>
          <tr><th>Email</th><td>${App.utils ? App.utils.escapeHtml(email) : email}</td></tr>
          <tr><th>Phone / Teléfono</th><td>${App.utils ? App.utils.escapeHtml(phone) : phone}</td></tr>
          <tr><th>License # / Licencia</th><td>&nbsp;</td></tr>
        </table>
      </td>
      <td style="width:4%; border:none; background:none;"></td>
      <td style="width:46%; vertical-align:top; padding:0;">
        <div class="broker-title">Broker B — Receiving Brokerage / Agencia Receptora</div>
        <table style="margin-bottom:0; border-top:none;">
          <tr><th>Brokerage / Agencia</th><td>Megagestión Servicios Inmobiliarios</td></tr>
          <tr><th>Broker of Record</th><td><strong>José Martínez Sánchez</strong></td></tr>
          <tr><th>Country / País</th><td>Spain / España</td></tr>
          <tr><th>Email</th><td>jose.martinez@remax.es</td></tr>
          <tr><th>Phone / Teléfono</th><td>+34 966 665 651</td></tr>
          <tr><th>CIF (Tax ID)</th><td>B-54829767</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Clause 1 -->
  <div class="clause">
    <h3>1. Purpose &amp; Scope / Objeto y Alcance</h3>
    <p>The purpose of this Agreement is to establish the terms under which Broker A may refer prospective international buyers (clients) to Broker B for the purchase of real estate in Spain, specifically within the provinces of Alicante and the Costa Blanca region. This agreement covers all future client referrals submitted by Broker A.</p>
    <span class="lang-divider">El objeto de este Acuerdo es establecer las condiciones bajo las cuales el Corredor A podrá referir compradores internacionales (clientes) al Corredor B para la compra de inmuebles en España, específicamente en la provincia de Alicante y la Costa Blanca. Este acuerdo cubre todos los futuros clientes referidos enviados por el Corredor A.</span>
  </div>

  <!-- Clause 2 -->
  <div class="clause">
    <h3>2. B2B Relationship / Relación Comercial B2B</h3>
    <p>This agreement represents a business-to-business (B2B) marketing and referral contract. Broker A is a legally licensed brokerage in its jurisdiction of origin (United States or Canada) and Broker B is a licensed real estate entity in Spain. As this is an international service referral, Broker A and its agents do not require licensing or registration in Spain to receive this B2B service fee.</p>
    <span class="lang-divider">Este acuerdo representa un contrato de marketing y referido B2B. El Corredor A es una agencia legalmente autorizada en su jurisdicción de origen (EE. UU. o Canadá) y el Corredor B es una entidad inmobiliaria con licencia en España. Al tratarse de un servicio de referido internacional, el Corredor A y sus agentes no requieren licencia española para percibir estos honorarios.</span>
  </div>

  <!-- Clause 3 -->
  <div class="clause">
    <h3>3. Commission Structure / Estructura de Comisión</h3>
    <p>For every referred client whose property acquisition in Spain is successfully closed, Broker B shall pay Broker A a referral fee of <strong>25% (twenty-five percent)</strong> of the gross buyer-side commission received by Broker B on that transaction.</p>
    <div class="example-box">
      <strong>💡 Example / Ejemplo (25% Split):</strong><br>
      • Purchase price / Precio de compra: <strong>€400,000</strong><br>
      • Gross buyer commission (5%) / Comisión bruta (5%): <strong>€20,000</strong><br>
      • Referral fee to Broker A (25%) / Pago al Corredor A: <strong>€5,000 EUR</strong> (wire/transferencia)
    </div>
    <span class="lang-divider">Por cada cliente referido cuya adquisición de propiedad en España se cierre exitosamente, el Corredor B pagará al Corredor A una comisión de referido del <strong>25% (veinticinco por ciento)</strong> de la comisión bruta del lado comprador cobrada por el Corredor B en dicha transacción.</span>
  </div>

  <!-- Clause 4 -->
  <div class="clause">
    <h3>4. Broker Compensation / Compensación entre Corredores</h3>
    <p>All referral fees are paid strictly Broker-to-Broker. Broker A is solely responsible for any internal distribution of the commission within its brokerage. Broker B is responsible for any internal distribution within its brokerage.</p>
    <span class="lang-divider">Todos los honorarios de referido se pagan estrictamente de Corredor a Corredor. El Corredor A es el único responsable de cualquier distribución interna de la comisión dentro de su agencia. El Corredor B es responsable de cualquier distribución interna dentro de su agencia.</span>
  </div>

  <!-- Clause 5 -->
  <div class="clause">
    <h3>5. Client Lock Period / Vigencia del Referido</h3>
    <p>Each referred client is protected for a period of <strong>24 months</strong> from the date of registration in the Partner Portal. Broker A is entitled to the referral fee for any transaction completed by that referred client in Spain during this period.</p>
    <span class="lang-divider">Cada cliente referido estará protegido durante un periodo de <strong>24 meses</strong> desde la fecha de registro en el Portal de Socios. El Corredor A tendrá derecho a la comisión de referido por cualquier transacción completada por dicho cliente en España durante este periodo.</span>
  </div>

  <!-- Clause 6 -->
  <div class="clause">
    <h3>6. Settlement &amp; Tax Compliance / Liquidación y Cumplimiento Fiscal</h3>
    <p>Referral fees shall be wired to Broker A within <strong>30 business days</strong> of transaction closing and receipt of clear funds by Broker B. US-based brokerages must provide a completed <strong>IRS Form W-8BEN-E</strong> (or Canadian equivalent) and a commercial invoice prior to payment to prevent local Spanish withholding tax.</p>
    <span class="lang-divider">Los honorarios de referido se transferirán al Corredor A dentro de los <strong>30 días hábiles</strong> posteriores al cierre de la transacción y cobro de los fondos por el Corredor B. Las agencias de EE. UU. deben entregar el formulario <strong>IRS W-8BEN-E</strong> (o equivalente canadiense) y una factura comercial antes del pago para evitar retenciones fiscales en España.</span>
  </div>

  <!-- Clause 7 -->
  <div class="clause">
    <h3>7. Duration &amp; Termination / Vigencia y Resolución</h3>
    <p>This Agreement is effective for an initial period of <strong>12 months</strong> from the date of signature, automatically renewing for successive 12-month periods unless either party provides <strong>60 days' written notice</strong> of termination. Termination shall not affect referral rights on clients already registered prior to the termination date.</p>
    <span class="lang-divider">Este Acuerdo tendrá una vigencia inicial de <strong>12 meses</strong> desde la fecha de firma, renovándose automáticamente por períodos sucesivos de 12 meses salvo que cualquiera de las partes comunique su resolución con un preaviso de <strong>60 días por escrito</strong>. La resolución no afectará los derechos de referido sobre clientes ya registrados antes de la fecha de resolución.</span>
  </div>

  <!-- Clause 8 -->
  <div class="clause">
    <h3>8. Governing Law / Ley Aplicable</h3>
    <p>This agreement is governed by the laws of Spain. Any disputes shall be submitted exclusively to the Courts of Alicante, Spain.</p>
    <span class="lang-divider">Este acuerdo se rige por las leyes de España. Cualquier controversia se someterá exclusivamente a la jurisdicción de los Tribunales de Alicante, España.</span>
  </div>

  <!-- Signatures -->
  <div class="signatures">
    <h3 style="text-align:center; border:none; margin-bottom:16pt;">Signatures / Firmas</h3>
    <table>
      <tr>
        <td style="width:48%; vertical-align:top; padding:12pt;">
          <strong>Broker A — Referring Brokerage / Representante Corredor A</strong>
          <br><br>
          <div class="sig-line" style="margin-top:30pt;"></div>
          <p class="sig-field">Signature / Firma</p>
          <br>
          <div class="sig-line"></div>
          <p class="sig-field">Print Name / Nombre: <strong>${App.utils ? App.utils.escapeHtml(fullName) : fullName}</strong></p>
          <br>
          <div class="sig-line"></div>
          <p class="sig-field">Title / Cargo: ___________________________</p>
          <br>
          <div class="sig-line"></div>
          <p class="sig-field">Date / Fecha: ___________________________</p>
        </td>
        <td style="width:4%; border:none; background:none;"></td>
        <td style="width:48%; vertical-align:top; padding:12pt;">
          <strong>Broker B — Megagestión / Representante Corredor B</strong>
          <br><br>
          <div class="sig-line" style="margin-top:30pt;"></div>
          <p class="sig-field">Signature / Firma</p>
          <br>
          <div class="sig-line"></div>
          <p class="sig-field">Print Name / Nombre: <strong>José Martínez Sánchez</strong></p>
          <br>
          <div class="sig-line"></div>
          <p class="sig-field">Title / Cargo: <strong>Managing Broker / Corredor de la Oficina</strong></p>
          <br>
          <div class="sig-line"></div>
          <p class="sig-field">Date / Fecha: ___________________________</p>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    Megagestión Servicios Inmobiliarios &bull; Carrer Conrado del Campo 16, 03204, Elche (Alicante), Spain &bull; CIF: B-54829767 &bull; jose.martinez@remax.es &bull; +34 966 665 651<br>
    &copy; ${new Date().getFullYear()} Megagestión Servicios Inmobiliarios. All Rights Reserved / Reservados todos los derechos.
  </div>

</body>
</html>`;

    // Create and download as .doc (Word-compatible HTML)
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Referral_Agreement_${(user.lastName || 'User').replace(/\s+/g,'_')}_${agentName !== '___________________' ? agentName.split(' ').pop().replace(/\s+/g,'_') + '_' : ''}${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

})();
