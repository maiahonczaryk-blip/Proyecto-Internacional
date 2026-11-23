/* ============================================================
   RE/MAX Inmomás — Role-Based Referral & Collaboration Agreement Generator
   ============================================================
   Generates a downloadable MS Word (.doc) contract dynamically
   adapted to the registered user's role:
   • embajador   → Acuerdo Marco de Embajador y Red Paraguas
   • colaborador → Acuerdo de Colaboración Estratégica y Referidos
   • broker      → Acuerdo Marco de Agencia / Broker (Master Referral Agreement)
   • realtor     → Acuerdo de Colaboración de Agente Inmobiliario (Realtor)
   ============================================================ */

;(function() {
  'use strict';

  window.App = window.App || {};

  function resolveTargetRole(userData, agentData, fallbackUser) {
    if (userData && userData.templateRole) {
      const tpl = String(userData.templateRole).trim().toLowerCase();
      if (tpl === 'realtor') return 'realtor_direct';
      if (['embajador', 'colaborador', 'broker', 'realtor_direct', 'realtor_broker'].includes(tpl)) {
        return tpl;
      }
    }
    if (agentData && String(agentData.role || '').trim().toLowerCase() === 'realtor') {
      return 'realtor_broker';
    }
    const raw = (userData && userData.role) || (fallbackUser && fallbackUser.role) || 'broker';
    const norm = String(raw).trim().toLowerCase();
    if (norm === 'realtor') {
      const targetUser = userData || fallbackUser || {};
      const hasBroker = Boolean(targetUser.brokerId || targetUser.brokerNameManual);
      return hasBroker ? 'realtor_broker' : 'realtor_direct';
    }
    if (['embajador', 'colaborador', 'broker', 'realtor_direct', 'realtor_broker'].includes(norm)) {
      return norm;
    }
    return 'broker';
  }

  function getDocRoleConfig(role) {
    const configs = {
      embajador: {
        role: 'embajador',
        docTitleEn: 'AMBASSADOR UMBRELLA & REFERRAL AGREEMENT',
        docTitleEs: 'Acuerdo Marco de Embajador Internacional y Red Paraguas',
        toastLabel: 'Acuerdo de Embajador exportado a Word (.doc)',
        filePrefix: 'Acuerdo_Embajador',
        refPrefix: 'INM-EMB',
        headerColor: '#92400e',
        partyATitle: 'Ambassador A — International Ambassador / Embajador Internacional (Red Paraguas)',
        bankBoxTitle: 'Ambassador A — Bank Account for Commission Wire / Cuenta Bancaria del Embajador',
        legalNameLabel: 'Legal Entity / Razón Social',
        taxIdLabel: 'Tax ID / EIN / NIF / CIF',
        signerLabel: 'Ambassador / Representante',
        licenseLabel: 'Prof. License / Licencia (Opc.)',
        extraRowLabel: 'Umbrella Scope / Alcance',
        sigHeaderA: 'Ambassador A — International Ambassador / Embajador A',
        sigDefaultTitle: 'International Ambassador / Embajador Internacional',
        clauses: [
          {
            title: '1. Purpose &amp; Umbrella Scope / Objeto y Alcance del Paraguas',
            en: 'The purpose of this Agreement is to establish the terms under which Ambassador A acts as an International Ambassador for Broker B (RE/MAX Inmomás), both by referring prospective international buyers directly and by onboarding and coordinating an Umbrella Network of Brokers (25%), Direct Agents/Realtors (15%), and Strategic Collaborators (10%) interested in the Alicante, Costa Blanca, and Spanish real estate markets.',
            es: 'El objeto de este Acuerdo es establecer las condiciones bajo las cuales el Embajador A actúa como Embajador Internacional para RE/MAX Inmomás (Corredor B), tanto refiriendo compradores internacionales de forma directa como incorporando y coordinando bajo su Red Paraguas a Brokers (25%), Agentes Directos (15%) y Colaboradores Estratégicos (10%) interesados en el mercado inmobiliario de Alicante, Costa Blanca y España.'
          },
          {
            title: '2. B2B Commercial &amp; Network Relationship / Relación Mercantil Internacional B2B',
            en: 'This agreement constitutes an independent international business-to-business (B2B) commercial representation, network coordination, and client-introduction contract. Ambassador A operates independently in their jurisdiction of origin and does not require real estate licensing or registration in Spain to receive international referral or umbrella coordination fees.',
            es: 'Este acuerdo constituye un contrato mercantil internacional independiente (B2B) de representación comercial, coordinación de red y presentación de clientes. El Embajador A opera de forma independiente en su jurisdicción de origen y no requiere colegiación ni licencia inmobiliaria en España para percibir honorarios internacionales de referido o de paraguas.'
          },
          {
            title: '3. Commission &amp; Umbrella Structure / Estructura de Comisiones y Paraguas (+15% / 25%)',
            en: 'For every closed purchase originated by Brokers (25%), Direct Agents (15%), or Collaborators (10%) registered under Ambassador A\'s Umbrella Network, RE/MAX Inmomás shall pay Ambassador A an additional Umbrella override of <strong>15% (fifteen percent)</strong> of the gross buyer-side commission collected, funded entirely by RE/MAX Inmomás without deducting from the referred partner\'s fee. For direct buyers referred personally by Ambassador A without an intermediate partner, RE/MAX Inmomás shall pay Ambassador A <strong>25% (twenty-five percent)</strong>.',
            es: 'Por cada compraventa cerrada originada por Brokers (25%), Agentes Directos (15%) o Colaboradores (10%) registrados bajo la Red Paraguas del Embajador A, RE/MAX Inmomás abonará al Embajador A una participación adicional de paraguas del <strong>15% (quince por ciento)</strong> de la comisión bruta del lado comprador cobrada, asumida íntegramente por RE/MAX Inmomás sin restar del porcentaje del socio vinculado. Por compradores directos referidos personalmente por el Embajador A sin socio intermedio, RE/MAX Inmomás abonará el <strong>25% (veinticinco por ciento)</strong>.',
            exampleHtml: `
              <div class="example-box">
                <strong>💡 Umbrella &amp; Direct Examples / Ejemplos de Liquidación (€400,000 Purchase → €20,000 Buyer Fee):</strong><br>
                • <strong>Umbrella Network (+15%):</strong> Ambassador A receives <strong>€3,000 EUR</strong> while Broker keeps 25% (€5,000), Direct Agent keeps 15% (€3,000), or Collaborator keeps 10% (€2,000).<br>
                • <strong>Direct Buyer Referral (25%):</strong> Ambassador A receives <strong>€5,000 EUR</strong> (wire/transferencia).
              </div>`
          },
          {
            title: '4. Payment &amp; Network Hierarchy Rules / Liquidación y Reglas de Jerarquía',
            en: 'All fees due to Ambassador A shall be paid directly to Ambassador A\'s designated bank account. Within the Umbrella Network: Brokers (25%) may group Agents and Collaborators (10%); Direct Agents (15%) may hang under Ambassador A (never having Collaborators beneath an Agent); and Collaborators (10%) may operate directly under Ambassador A or under a Broker (never under an Agent).',
            es: 'Todos los honorarios correspondientes al Embajador A se abonarán directamente en la cuenta bancaria designada por el Embajador A. Dentro de la Red Paraguas: los Brokers (25%) pueden agrupar Agentes y Colaboradores (10%); los Agentes Directos (15%) pueden colgar del Embajador A (sin tener nunca Colaboradores debajo de un Agente); y los Colaboradores (10%) pueden operar bajo el Embajador A o bajo un Broker (nunca debajo de un Agente).'
          },
          {
            title: '5. Umbrella &amp; Client Protection Period / Protección de Red y Clientes',
            en: 'Each direct buyer registered by Ambassador A in the Portal is protected for <strong>24 months</strong> from registration. Professionals (Brokers, Direct Agents, and Collaborators) registered through Ambassador A\'s unique Umbrella Link remain attributed to Ambassador A\'s network while this Agreement remains active.',
            es: 'Cada comprador directo registrado por el Embajador A en el Portal queda protegido durante <strong>24 meses</strong> desde su registro. Los profesionales (Brokers, Agentes Directos y Colaboradores) dados de alta mediante el enlace único de Paraguas del Embajador A permanecerán vinculados a su red mientras este Acuerdo continúe vigente.'
          }
        ]
      },

      colaborador: {
        role: 'colaborador',
        docTitleEn: 'STRATEGIC COLLABORATOR REFERRAL AGREEMENT (10% SUCCESS FEE)',
        docTitleEs: 'Acuerdo de Colaboración Estratégica y Referidos Internacionales (10% a Éxito)',
        toastLabel: 'Acuerdo de Colaborador (10%) exportado a Word (.doc)',
        filePrefix: 'Acuerdo_Colaborador',
        refPrefix: 'INM-COL',
        headerColor: '#5b21b6',
        partyATitle: 'Collaborator A — Strategic Collaborator / Colaborador Estratégico Referente',
        bankBoxTitle: 'Collaborator A — Bank Account for Referral Fee Wire / Cuenta Bancaria del Colaborador',
        legalNameLabel: 'Company or Firm / Razón Social',
        taxIdLabel: 'Tax ID / EIN / NIF / CIF',
        signerLabel: 'Collaborator / Firmante',
        licenseLabel: 'Registration / Actividad (Opc.)',
        extraRowLabel: 'Hierarchy &amp; Scope / Modalidad',
        sigHeaderA: 'Collaborator A — Strategic Collaborator / Colaborador A',
        sigDefaultTitle: 'Strategic Collaborator / Colaborador Estratégico',
        clauses: [
          {
            title: '1. Purpose &amp; Hierarchy Scope / Objeto y Reglas de Vinculación',
            en: 'The purpose of this Agreement is to establish the terms under which Collaborator A may introduce and refer prospective international buyers (clients) to RE/MAX Inmomás (Party B) for the acquisition of real estate in Alicante, the Costa Blanca region, and Spain. Collaborator A may operate directly with RE/MAX Inmomás, linked under a Broker, or linked under an International Ambassador, <strong>but may never be subordinated under an individual Real Estate Agent/Realtor</strong>.',
            es: 'El objeto de este Acuerdo es establecer las condiciones bajo las cuales el Colaborador A podrá presentar y referir compradores internacionales (clientes) a RE/MAX Inmomás (Parte B) para la adquisición de bienes inmuebles en Alicante, la Costa Blanca y España. El Colaborador A podrá operar directamente con RE/MAX Inmomás, vinculado bajo un Broker o bajo un Embajador Internacional, <strong>pero nunca podrá depender ni colgar jerárquicamente de un Agente inmobiliario individual</strong>.'
          },
          {
            title: '2. B2B Non-Brokerage Introduction &amp; US Safeguard / Colaboración Mercantil y Salvaguarda Normativa',
            en: 'This agreement represents an independent professional/commercial client-introduction contract (suitable for law firms, tax advisors, wealth managers, relocation consultants, chambers of commerce, or business connectors). Collaborator A acts strictly as an introducer without real estate brokerage mediation. Where mandatory local law (e.g., certain US state real estate statutes) restricts transaction-contingent referral fees to licensed brokerages, the Parties shall comply with applicable local regulations.',
            es: 'Este acuerdo constituye un contrato mercantil independiente de presentación de clientes (orientado a despachos jurídicos, asesores fiscales o patrimoniales, consultores de relocalización, cámaras o conectores profesionales). El Colaborador A actúa exclusivamente como presentador internacional sin intermediación inmobiliaria. Cuando la normativa local imperativa (p. ej. leyes estatales en EE. UU.) restrinja pagos a éxito sobre operaciones inmobiliarias a agencias con licencia, las Partes observarán estrictamente dicha legislación local.'
          },
          {
            title: '3. Success-Based Referral Fee (10%) / Honorarios de Colaboración a Éxito (10%)',
            en: 'Strictly contingent upon the successful public-deed closing and collection of fees, RE/MAX Inmomás shall pay Collaborator A a success-based referral fee of <strong>10% (ten percent)</strong> of the gross buyer-side commission effectively collected by RE/MAX Inmomás on that transaction.',
            es: 'Única y exclusivamente a éxito tras el cierre en escritura pública y el cobro efectivo de honorarios, RE/MAX Inmomás abonará al Colaborador A unos honorarios de colaboración del <strong>10% (diez por ciento)</strong> de la comisión bruta del lado comprador efectivamente percibida por RE/MAX Inmomás en dicha operación.',
            exampleHtml: `
              <div class="example-box">
                <strong>💡 Example / Ejemplo (10% Success-Based Collaborator Fee):</strong><br>
                • Purchase price / Precio de compra: <strong>€400,000</strong><br>
                • Gross buyer commission (5%) / Comisión bruta comprador (5%): <strong>€20,000</strong><br>
                • Success fee to Collaborator A (10%) / Pago a éxito Colaborador A: <strong>€2,000 EUR</strong> (wire/transferencia)
              </div>`
          },
          {
            title: '4. Direct Collaborator Settlement / Pago Directo al Colaborador',
            en: 'All referral fees are paid directly by RE/MAX Inmomás to Collaborator A\'s designated bank account upon issuance of the corresponding commercial/professional invoice. Collaborator A is solely responsible for their own tax and professional obligations in their country of fiscal residence.',
            es: 'Todos los honorarios de referido se abonan directamente por RE/MAX Inmomás en la cuenta bancaria designada por el Colaborador A previa emisión de la factura comercial o profesional correspondiente. El Colaborador A es el único responsable del cumplimiento de sus obligaciones fiscales en su país de residencia.'
          },
          {
            title: '5. Client Lock Period / Vigencia de Protección del Cliente',
            en: 'Each client referred and registered by Collaborator A in the Collaborator Portal is protected for a period of <strong>24 months</strong> from the date of registration. Collaborator A is entitled to the 10% referral fee for any property purchase completed by that client through RE/MAX Inmomás during this period.',
            es: 'Cada cliente referido y registrado por el Colaborador A en el Portal de Colaboradores queda protegido durante un periodo de <strong>24 meses</strong> desde la fecha de alta. El Colaborador A tendrá derecho a los honorarios del 10% sobre cualquier compra formalizada por dicho cliente con RE/MAX Inmomás durante ese plazo.'
          }
        ]
      },

      broker: {
        role: 'broker',
        docTitleEn: 'BROKERAGE MASTER REFERRAL AGREEMENT (25%)',
        docTitleEs: 'Acuerdo Marco de Colaboración para Broker / Agencia Inmobiliaria (25%)',
        toastLabel: 'Acuerdo de Broker (25%) exportado a Word (.doc)',
        filePrefix: 'Acuerdo_Broker',
        refPrefix: 'INM-BRK',
        headerColor: '#003da5',
        partyATitle: 'Broker A — Referring Brokerage / Agencia Broker Referente',
        bankBoxTitle: 'Broker A — Corporate Bank Account for Commission Wire / Cuenta Bancaria de la Agencia',
        legalNameLabel: 'Legal Name / Razón Social',
        taxIdLabel: 'Tax ID / EIN / NIF / CIF',
        signerLabel: 'Broker of Record / Representante',
        licenseLabel: 'Brokerage License # / Licencia',
        extraRowLabel: 'Coverage / Cobertura',
        sigHeaderA: 'Broker A — Referring Brokerage / Representante Broker A',
        sigDefaultTitle: 'Managing Broker / Broker of Record',
        clauses: [
          {
            title: '1. Purpose &amp; Brokerage Umbrella Scope / Objeto y Alcance de Agencia',
            en: 'The purpose of this Master Referral Agreement is to establish the terms under which Broker A (directly or through any licensed Realtor/Agent affiliated with Broker A\'s office) may refer prospective international buyers to Broker B (RE/MAX Inmomás) for the purchase of real estate in Alicante, the Costa Blanca region, and Spain. Non-agent Strategic Collaborators linked under Broker A\'s structure are governed by their specific 10% Collaborator schedule.',
            es: 'El objeto de este Acuerdo Marco es establecer las condiciones bajo las cuales el Broker A (directamente o a través de cualquiera de los Agentes/Realtors adscritos a su oficina/paraguas) podrá referir compradores internacionales al Corredor B (RE/MAX Inmomás) para la compra de inmuebles en Alicante, la Costa Blanca y España. Los Colaboradores Estratégicos no agentes vinculados a la estructura del Broker A se rigen por su acuerdo específico de Colaborador (10% a éxito).'
          },
          {
            title: '2. B2B Brokerage Relationship / Relación Comercial entre Agencias B2B',
            en: 'This agreement represents a business-to-business (B2B) real estate brokerage referral contract. Broker A is a legally licensed brokerage in its jurisdiction of origin and Broker B is a licensed real estate entity in Spain. As an international referral, Broker A and its affiliated agents do not require licensing in Spain to receive this B2B referral fee.',
            es: 'Este acuerdo representa un contrato mercantil B2B de referido entre agencias inmobiliarias. El Broker A es una agencia legalmente autorizada en su jurisdicción de origen y el Corredor B es una entidad inmobiliaria establecida en España. Al tratarse de un referido internacional, ni el Broker A ni sus agentes requieren licencia española para percibir estos honorarios.'
          },
          {
            title: '3. Commission Structure (25%) / Estructura de Comisión (25%)',
            en: 'For every client referred by Broker A or its affiliated Realtors whose property acquisition in Spain is successfully closed, Broker B shall pay Broker A a referral fee of <strong>25% (twenty-five percent)</strong> of the gross buyer-side commission received by Broker B on that transaction.',
            es: 'Por cada cliente referido por el Broker A o por los Realtors de su equipo cuya compra de propiedad en España se cierre exitosamente, el Corredor B abonará al Broker A una comisión de referido del <strong>25% (veinticinco por ciento)</strong> de la comisión bruta del lado comprador cobrada por el Corredor B en dicha operación.',
            exampleHtml: `
              <div class="example-box">
                <strong>💡 Example / Ejemplo (25% Brokerage Split):</strong><br>
                • Purchase price / Precio de compra: <strong>€400,000</strong><br>
                • Gross buyer commission (5%) / Comisión bruta (5%): <strong>€20,000</strong><br>
                • Referral fee to Broker A (25%) / Pago a Agencia Broker A: <strong>€5,000 EUR</strong> (wire/transferencia)
              </div>`
          },
          {
            title: '4. Broker-to-Broker Compensation / Compensación de Agencia a Agencia',
            en: 'All referral fees are paid strictly Broker-to-Broker to Broker A\'s corporate bank account. Broker A is solely responsible for any internal commission split with the referring Realtor/Agent within its brokerage.',
            es: 'Todos los honorarios de referido se abonan estrictamente de Agencia a Agencia (Broker-to-Broker) en la cuenta corporativa del Broker A. El Broker A es el único responsable del reparto interno de comisión con el Agente/Realtor referente de su oficina.'
          },
          {
            title: '5. Client Lock Period / Vigencia del Referido',
            en: 'Each referred client registered in the Partner Portal under Broker A or its team is protected for a period of <strong>24 months</strong> from registration. Broker A is entitled to the referral fee for any transaction completed by that client in Spain during this period.',
            es: 'Cada cliente referido y registrado en el Portal de Socios bajo el Broker A o su equipo queda protegido durante <strong>24 meses</strong> desde su alta. El Broker A tendrá derecho a la comisión de referido por cualquier compra completada por dicho cliente en España durante este periodo.'
          }
        ]
      },

      realtor_direct: {
        role: 'realtor_direct',
        docTitleEn: 'DIRECT REAL ESTATE AGENT REFERRAL AGREEMENT (15%)',
        docTitleEs: 'Acuerdo Directo de Colaboración para Agente Inmobiliario (15%)',
        toastLabel: 'Acuerdo Directo de Agente (15%) exportado a Word (.doc)',
        filePrefix: 'Acuerdo_Agente_Directo',
        refPrefix: 'INM-AGD',
        headerColor: '#047857',
        partyATitle: 'Agent A — Direct Referring Real Estate Agent / Agente Inmobiliario Referente Directo',
        bankBoxTitle: 'Agent A — Bank Account for Direct Commission Wire / Cuenta Bancaria del Agente',
        legalNameLabel: 'Professional or Entity / Titular Fiscal',
        taxIdLabel: 'Tax ID / SSN / EIN / NIF',
        signerLabel: 'Referring Agent / Agente Firmante',
        licenseLabel: 'Real Estate License # / Licencia',
        extraRowLabel: 'Hierarchy &amp; Scope / Modalidad',
        sigHeaderA: 'Agent A — Direct Referring Agent / Agente Directo A',
        sigDefaultTitle: 'Real Estate Agent / Agente Inmobiliario Independiente',
        clauses: [
          {
            title: '1. Purpose &amp; Hierarchy Scope / Objeto y Reglas de Jerarquía',
            en: 'The purpose of this Agreement is to establish the terms under which Agent A signs directly with RE/MAX Inmomás (Broker B) to refer prospective international buyers for the purchase of real estate in Alicante, the Costa Blanca region, and Spain. Agent A may operate directly with RE/MAX Inmomás or linked under an International Ambassador\'s Umbrella Network (preserving Agent A\'s full 15% fee intact). <strong>No Collaborators may ever be registered or subordinated beneath Agent A.</strong>',
            es: 'El objeto de este Acuerdo es establecer las condiciones bajo las cuales el Agente A firma directamente con RE/MAX Inmomás (Corredor B) para referir compradores internacionales interesados en adquirir inmuebles en Alicante, la Costa Blanca y España. El Agente A podrá operar de forma directa con RE/MAX Inmomás o vinculado bajo la Red Paraguas de un Embajador Internacional (manteniendo íntegro su 15%). <strong>En ningún caso podrán colgar ni vincularse Colaboradores debajo del Agente A.</strong>'
          },
          {
            title: '2. Direct Contracting Eligibility &amp; Local Compliance / Capacidad de Contratación Directa',
            en: 'Agent A represents and warrants that, under the laws and brokerage rules of Agent A\'s jurisdiction of origin, Agent A has full legal and professional authority to contract and invoice international referral fees directly. Where local real estate law (e.g., certain US states or Canadian provinces) requires referral compensation to be routed exclusively through a Managing Broker, collaboration shall instead be formalized via the 25% Brokerage Master Agreement.',
            es: 'El Agente A declara y garantiza que, conforme a la normativa profesional y mercantil de su jurisdicción de origen, cuenta con plena capacidad legal para contratar y facturar directamente honorarios internacionales de referido. En aquellas jurisdicciones donde la ley exija canalizar el cobro exclusivamente a través de un Managing Broker o Agencia (p. ej. determinados estados de EE. UU. o provincias de Canadá), la colaboración deberá articularse mediante el Acuerdo Marco de Broker (25%).'
          },
          {
            title: '3. Direct Agent Commission Structure (15%) / Estructura de Comisión Directa al Agente (15%)',
            en: 'When this Agreement is executed directly with Agent A and paid directly to Agent A, RE/MAX Inmomás shall pay Agent A a referral fee of <strong>15% (fifteen percent)</strong> of the gross buyer-side commission effectively collected by RE/MAX Inmomás upon successful closing.',
            es: 'Cuando el acuerdo se suscribe directamente con el Agente A y el pago se realiza directamente al Agente A, RE/MAX Inmomás abonará al Agente A unos honorarios de referido del <strong>15% (quince por ciento)</strong> de la comisión bruta del lado comprador efectivamente cobrada por RE/MAX Inmomás tras el cierre exitoso.',
            exampleHtml: `
              <div class="example-box">
                <strong>💡 Example / Ejemplo (15% Direct Agent Split):</strong><br>
                • Purchase price / Precio de compra: <strong>€400,000</strong><br>
                • Gross buyer commission (5%) / Comisión bruta comprador (5%): <strong>€20,000</strong><br>
                • Direct fee to Agent A (15%) / Pago directo al Agente A: <strong>€3,000 EUR</strong> (wire/transferencia)
              </div>`
          },
          {
            title: '4. Direct Settlement to Agent / Liquidación Directa al Agente',
            en: 'All referral fees under this Direct Agreement are wired directly by RE/MAX Inmomás to Agent A\'s designated bank account upon issuance of the corresponding invoice. Agent A is solely responsible for tax reporting and regulatory compliance in their jurisdiction.',
            es: 'Todos los honorarios devengados bajo este Acuerdo Directo se transfieren directamente por RE/MAX Inmomás a la cuenta bancaria designada por el Agente A previa emisión de la factura correspondiente. El Agente A es el único responsable de sus obligaciones fiscales y regulatorias en su país.'
          },
          {
            title: '5. Client Lock Period / Vigencia de Protección del Cliente',
            en: 'Each client registered through Agent A\'s personalized link or Portal account is protected under Agent A\'s name for <strong>24 months</strong> from the date of registration.',
            es: 'Cada cliente registrado a través del enlace personalizado o cuenta del Portal del Agente A queda protegido bajo su titularidad durante <strong>24 meses</strong> desde la fecha de registro.'
          }
        ]
      },

      realtor_broker: {
        role: 'realtor_broker',
        docTitleEn: 'REALTOR / AGENT REFERRAL AGREEMENT (VIA BROKERAGE — 25%)',
        docTitleEs: 'Acuerdo de Colaboración de Agente Inmobiliario (Vía Broker — 25%)',
        toastLabel: 'Acuerdo de Agente vía Broker (25%) exportado a Word (.doc)',
        filePrefix: 'Acuerdo_Realtor_Broker',
        refPrefix: 'INM-REA',
        headerColor: '#047857',
        partyATitle: 'Party A — Referring Brokerage &amp; Realtor / Agencia y Agente Referente',
        bankBoxTitle: 'Party A — Brokerage Bank Account for Commission Wire / Cuenta Bancaria de la Agencia',
        legalNameLabel: 'Brokerage Legal Name / Agencia',
        taxIdLabel: 'Tax ID / EIN / NIF / CIF',
        signerLabel: 'Managing Broker / Broker Resp.',
        licenseLabel: 'License # / Nº Licencia',
        extraRowLabel: 'Referring Realtor / Agente',
        sigHeaderA: 'Party A — Managing Broker &amp; Referring Realtor / Agencia y Agente A',
        sigDefaultTitle: 'Managing Broker (with Referring Realtor Acknowledgment)',
        clauses: [
          {
            title: '1. Purpose &amp; Scope / Objeto y Alcance',
            en: 'The purpose of this Agreement is to formalize the referral collaboration under which the Referring Realtor/Agent, operating through their licensed Brokerage (Party A), refers prospective international buyers to Broker B (RE/MAX Inmomás) for the purchase of real estate in Alicante, the Costa Blanca region, and Spain. Collaborators may never be subordinated under an individual Agent.',
            es: 'El objeto de este Acuerdo es formalizar la colaboración mediante la cual el Agente Inmobiliario / Realtor Referente, operando a través de su Agencia/Brokerage autorizada (Parte A), refiere compradores internacionales a RE/MAX Inmomás (Corredor B) para la adquisición de inmuebles en Alicante, la Costa Blanca y España. Nunca podrán colgar Colaboradores debajo de un Agente.'
          },
          {
            title: '2. B2B International Referral / Referido Internacional B2B',
            en: 'This agreement represents an international B2B real estate referral contract. Party A is duly licensed in its jurisdiction of origin and Broker B is a licensed real estate entity in Spain. Neither the Brokerage nor the Referring Realtor requires Spanish licensing to earn international referral fees.',
            es: 'Este acuerdo constituye un contrato internacional B2B de referido inmobiliario. La Parte A cuenta con autorización legal en su jurisdicción de origen y RE/MAX Inmomás opera legalmente en España. Ni la Agencia ni el Realtor Referente requieren licencia española para devengar estos honorarios internacionales.'
          },
          {
            title: '3. Commission Structure via Brokerage (25%) / Estructura de Comisión vía Agencia (25%)',
            en: 'For every client referred by the Referring Realtor through Party A\'s Brokerage whose property purchase in Spain is successfully closed, Broker B shall pay Party A\'s Brokerage a referral fee of <strong>25% (twenty-five percent)</strong> of the gross buyer-side commission received by Broker B on that transaction (note: where an Agent contracts directly without a Brokerage, the Direct Agent rate is 15%).',
            es: 'Por cada cliente referido por el Agente / Realtor Referente a través de su Agencia (Parte A) cuya compra en España se cierre exitosamente, RE/MAX Inmomás abonará a la Agencia (Parte A) una comisión de referido del <strong>25% (veinticinco por ciento)</strong> de la comisión bruta del lado comprador cobrada en dicha transacción (nota: cuando el Agente contrata directamente sin Broker, la tarifa de Agente Directo es del 15%).',
            exampleHtml: `
              <div class="example-box">
                <strong>💡 Example / Ejemplo (25% Brokerage Channel Split):</strong><br>
                • Purchase price / Precio de compra: <strong>€400,000</strong><br>
                • Gross buyer commission (5%) / Comisión bruta (5%): <strong>€20,000</strong><br>
                • Referral fee to Brokerage Party A (25%) / Pago a la Agencia Parte A: <strong>€5,000 EUR</strong> (for internal split with Realtor)
              </div>`
          },
          {
            title: '4. Brokerage Settlement &amp; Realtor Attribution / Liquidación a Agencia y Atribución al Agente',
            en: 'In compliance with real estate regulations, referral fees are wired to Party A\'s Brokerage corporate bank account, attributing the transaction to the named Referring Realtor so Party A may disburse the Realtor\'s internal share promptly.',
            es: 'De conformidad con la normativa inmobiliaria aplicable, los honorarios se transfieren a la cuenta bancaria corporativa de la Agencia (Parte A) con atribución expresa al Agente / Realtor Referente, para su correspondiente liquidación interna.'
          },
          {
            title: '5. Client Lock Period / Vigencia de Protección del Cliente',
            en: 'Each client registered through the Referring Realtor\'s personalized link or Portal account is protected under their name for <strong>24 months</strong> from the date of registration.',
            es: 'Cada cliente registrado a través del enlace personalizado o cuenta del Portal del Agente / Realtor Referente queda protegido bajo su titularidad durante <strong>24 meses</strong> desde la fecha de registro.'
          }
        ]
      }
    };

    return configs[role] || configs.broker;
  }

  /**
   * generateReferralAgreementDoc(userData, agentData)
   * Creates and downloads a Word-compatible .doc file dynamically tailored
   * to Embajador, Colaborador, Broker, or Realtor.
   * @param {Object} userData - User profile object (or { isTemplate: true, templateRole: 'embajador'|'colaborador'|'broker'|'realtor' })
   * @param {Object} agentData - Optional Referring Agent object (e.g. when a Broker exports a team Realtor's agreement)
   * @param {Object} options - Optional { preview: true } to display the agreement in a modal instead of downloading
   */
  App.generateReferralAgreementDoc = function(userData, agentData, options) {
    const isTemplate = Boolean(userData && userData.isTemplate);
    const sessionUser = (App.auth && typeof App.auth.getCurrentUser === 'function') ? App.auth.getCurrentUser() : null;
    const user = isTemplate ? {} : (userData || sessionUser || {});
    const targetRole = resolveTargetRole(userData, agentData, user);
    const cfg = getDocRoleConfig(targetRole);
    const cd = user.contractCompanyData || {};
    const agent = agentData || {};

    const esc = (val) => (App.utils && typeof App.utils.escapeHtml === 'function')
      ? App.utils.escapeHtml(String(val ?? ''))
      : String(val ?? '');

    const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const isDirectSignerRole = ['embajador', 'colaborador', 'broker', 'realtor_direct'].includes(targetRole);

    const signerName = isTemplate
      ? '___________________'
      : (cd.brokerFullName || cd.brokerSignerName || (isDirectSignerRole ? userFullName : (user.brokerNameManual || userFullName)) || '___________________');

    const legalEntity = isTemplate
      ? '___________________'
      : (cd.companyLegalName || user.agencyName || (['colaborador', 'realtor_direct'].includes(targetRole) ? userFullName : user.brokerNameManual) || '___________________');

    const taxId      = isTemplate ? '___________________' : (cd.taxId || '___________________');
    const licenseNum = isTemplate ? '___________________' : (cd.licenseNumber || (targetRole === 'embajador' || targetRole === 'colaborador' ? 'N/A (No requerida)' : '___________________'));
    const fiscalAddr = isTemplate ? '___________________' : (cd.fiscalAddress || '___________________');
    const email      = isTemplate ? '___________________' : (cd.brokerEmail || cd.brokerSignerEmail || user.email || '___________________');
    const phone      = isTemplate ? '___________________' : (cd.brokerPhone || cd.brokerSignerPhone || user.phone || '___________________');
    const country    = isTemplate ? '___________________' : (cd.country || cd.fiscalCountry || user.country || 'United States / Canada');

    // Extra role-specific row value in Party A table
    let extraRowValue = '___________________';
    const agentName = (agent.firstName && agent.lastName)
      ? `${agent.firstName} ${agent.lastName}`.trim()
      : (agent.name || ((targetRole === 'realtor_broker' || targetRole === 'realtor_direct') && userFullName ? userFullName : ''));
    const agentEmail = agent.email || ((targetRole === 'realtor_broker' || targetRole === 'realtor_direct') && user.email ? user.email : '');

    if (targetRole === 'embajador') {
      const embCode = (!isTemplate && user.referralCode) ? ` (${user.referralCode})` : '';
      extraRowValue = isTemplate
        ? 'Direct Buyers (25%) + Umbrella Network (+15%)'
        : `Paraguas Embajador (+15%) + Clientes Directos (25%)${embCode}`;
    } else if (targetRole === 'colaborador') {
      extraRowValue = '10% Success Fee — Direct / Under Broker / Under Ambassador';
    } else if (targetRole === 'broker') {
      extraRowValue = '25% Brokerage Split — Agents & Linked Collaborators (10%)';
    } else if (targetRole === 'realtor_direct') {
      extraRowValue = '15% Direct Agent Agreement — Direct / Under Ambassador';
    } else {
      extraRowValue = isTemplate
        ? '___________________ (___________________)'
        : `${agentName || '___________________'}${agentEmail ? ` (${agentEmail})` : ''}`;
    }

    // Bank Account Details
    const bankHolder  = isTemplate ? '___________________' : (cd.bankAccountHolder || cd.companyLegalName || (['colaborador', 'realtor_direct'].includes(targetRole) ? userFullName : '') || '___________________');
    const bankName    = isTemplate ? '___________________' : (cd.bankName || '___________________');
    const bankAccount = isTemplate ? '___________________' : (cd.bankAccountNumber || '___________________');
    const bankSwift   = isTemplate ? '___________________' : (cd.bankSwiftRouting || '___________________');
    const bankAddress = isTemplate ? '___________________' : (cd.bankAddress || '___________________');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const docRefCode = `${cfg.refPrefix}-${Date.now().toString().slice(-6)}`;

    const dynamicClausesHtml = cfg.clauses.map(cl => `
      <div class="clause">
        <h3>${cl.title}</h3>
        <p>${cl.en}</p>
        ${cl.exampleHtml || ''}
        <span class="lang-divider">${cl.es}</span>
      </div>
    `).join('');

    const realtorAckBlockHtml = targetRole === 'realtor_broker' ? `
      <br>
      <div class="sig-line"></div>
      <p class="sig-field">Referring Realtor / Agente Referente: <strong>${esc(isTemplate ? '___________________' : (agentName || '___________________'))}</strong></p>
    ` : '';

    const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${esc(cfg.docTitleEn)} — RE/MAX Inmomás</title>
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
    h1 { font-size: 16pt; color: ${cfg.headerColor}; text-align: center; margin-bottom: 2pt; font-weight: bold; }
    h2 { font-size: 12pt; color: #e11b22; text-align: center; margin-bottom: 16pt; font-weight: 600; }
    h3 { font-size: 11pt; color: ${cfg.headerColor}; font-weight: bold; margin-top: 16pt; margin-bottom: 6pt; border-bottom: 1.5pt solid ${cfg.headerColor}; padding-bottom: 2pt; }
    .header-bar { 
      border-top: 4pt solid #e11b22;
      border-bottom: 2pt solid ${cfg.headerColor};
      padding: 12pt 0;
      margin-bottom: 20pt;
      text-align: center;
    }
    .header-bar p { color: #7f8c8d; margin: 4pt 0 0; font-size: 10pt; text-transform: uppercase; letter-spacing: 1pt; }
    .doc-ref { text-align: right; font-size: 9pt; color: #95a5a6; margin-bottom: 16pt; border-bottom: 1pt solid #ecf0f1; padding-bottom: 8pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20pt; }
    td, th { border: 1pt solid #bdc3c7; padding: 7pt 10pt; font-size: 10pt; vertical-align: middle; }
    th { background-color: #f4f6f9; color: ${cfg.headerColor}; font-weight: bold; width: 34%; text-align: left; }
    .broker-title { font-size: 10.5pt; font-weight: bold; color: #ffffff; background: ${cfg.headerColor}; padding: 7pt 12pt; margin-bottom: 0; border: 1pt solid ${cfg.headerColor}; }
    .example-box { background: #f8f9fa; border-left: 3pt solid #e11b22; padding: 10pt 14pt; margin: 10pt 0; font-size: 10pt; color: #34495e; }
    .lang-divider { display: block; color: #7f8c8d; font-size: 9.5pt; font-style: italic; margin-top: 4pt; line-height: 1.4; }
    .clause { margin-bottom: 16pt; text-align: justify; }
    .signatures { margin-top: 32pt; page-break-inside: avoid; }
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
    <strong style="font-size:15pt; color:${cfg.headerColor};">${esc(cfg.docTitleEn)}</strong>
  </p>
  <p style="text-align:center; font-size:11pt; color:#e11b22; margin-bottom:6pt; font-weight:bold;">
    ${esc(cfg.docTitleEs)}
  </p>
  <p class="doc-ref">
    Date / Fecha: <strong>${today}</strong> &nbsp;|&nbsp; Ref: <strong>${docRefCode}</strong>
  </p>

  <!-- Party A & Party B Cards -->
  <table>
    <tr>
      <td style="width:50%; vertical-align:top; padding:0;">
        <div class="broker-title">${cfg.partyATitle}</div>
        <table style="margin-bottom:0; border-top:none;">
          <tr><th>${esc(cfg.legalNameLabel)}</th><td>${esc(legalEntity)}</td></tr>
          <tr><th>${esc(cfg.taxIdLabel)}</th><td>${esc(taxId)}</td></tr>
          <tr><th>${esc(cfg.signerLabel)}</th><td>${esc(signerName)}</td></tr>
          <tr><th>${esc(cfg.licenseLabel)}</th><td>${esc(licenseNum)}</td></tr>
          <tr><th>Registered Address / Domicilio</th><td>${esc(fiscalAddr)}</td></tr>
          <tr><th>Country / País</th><td>${esc(country)}</td></tr>
          <tr><th>Email</th><td>${esc(email)}</td></tr>
          <tr><th>Phone / Teléfono</th><td>${esc(phone)}</td></tr>
          <tr><th>${esc(cfg.extraRowLabel)}</th><td>${esc(extraRowValue)}</td></tr>
        </table>
      </td>
      <td style="width:4%; border:none; background:none;"></td>
      <td style="width:46%; vertical-align:top; padding:0;">
        <div class="broker-title" style="background:#003da5; border-color:#003da5;">Party B — Receiving Brokerage / Agencia Receptora</div>
        <table style="margin-bottom:0; border-top:none;">
          <tr><th>Legal Name / Razón Social</th><td>Megagestión Servicios Inmobiliarios S.L. (RE/MAX Inmomás)</td></tr>
          <tr><th>CIF (Tax ID)</th><td>B-54829767</td></tr>
          <tr><th>Managing Broker</th><td><strong>José Martínez Sánchez</strong></td></tr>
          <tr><th>Registered Address / Domicilio</th><td>Carrer Conrado del Campo 16, 03204, Elche (Alicante)</td></tr>
          <tr><th>Country / País</th><td>Spain / España</td></tr>
          <tr><th>Email</th><td>jose.martinez@remax.es</td></tr>
          <tr><th>Phone / Teléfono</th><td>+34 647 86 19 68</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Bank Account Details for Party A -->
  <table>
    <tr>
      <td colspan="4" class="broker-title" style="background:#1e3a8a; border-color:#1e3a8a;">
        ${esc(cfg.bankBoxTitle)}
      </td>
    </tr>
    <tr>
      <th style="width:22%;">Account Holder / Titular</th>
      <td style="width:28%;">${esc(bankHolder)}</td>
      <th style="width:22%;">Bank Name / Banco</th>
      <td style="width:28%;">${esc(bankName)}</td>
    </tr>
    <tr>
      <th>Account # / IBAN</th>
      <td>${esc(bankAccount)}</td>
      <th>SWIFT / BIC / Routing (ABA)</th>
      <td>${esc(bankSwift)}</td>
    </tr>
    <tr>
      <th>Bank Address / Dirección</th>
      <td colspan="3">${esc(bankAddress)}</td>
    </tr>
  </table>

  <!-- Clauses 1 to 5 (Role-Specific) -->
  ${dynamicClausesHtml}

  <!-- Clause 6 -->
  <div class="clause">
    <h3>6. Settlement &amp; Tax Compliance / Liquidación y Cumplimiento Fiscal</h3>
    <p>Referral fees shall be wired to Party A within <strong>30 business days</strong> of public deed closing before Notary in Spain and receipt of clear commission funds by RE/MAX Inmomás. Non-resident entities or professionals must provide a commercial invoice and a valid tax residency certificate (e.g., <strong>IRS Form W-8BEN-E / W-8BEN</strong> for US residents, or equivalent double-taxation treaty certificate) prior to payment to prevent local Spanish withholding tax.</p>
    <span class="lang-divider">Los honorarios se transferirán a la Parte A dentro de los <strong>30 días hábiles</strong> posteriores a la firma de escritura pública ante Notario en España y cobro efectivo de los honorarios por RE/MAX Inmomás. Las entidades o profesionales no residentes deberán aportar factura comercial y certificado de residencia fiscal (ej. formulario <strong>IRS W-8BEN-E / W-8BEN</strong> en EE. UU., o certificado equivalente de convenio de doble imposición) antes del pago para evitar retenciones fiscales en España.</span>
  </div>

  <!-- Clause 7 -->
  <div class="clause">
    <h3>7. Duration &amp; Termination / Vigencia y Resolución</h3>
    <p>This Agreement is effective for an initial period of <strong>12 months</strong> from the date of signature, automatically renewing for successive 12-month periods unless either party provides <strong>60 days' written notice</strong> of termination. Termination shall not affect rights on clients already registered prior to the termination date.</p>
    <span class="lang-divider">Este Acuerdo tendrá una vigencia inicial de <strong>12 meses</strong> desde la fecha de firma, renovándose automáticamente por períodos anuales sucesivos salvo preaviso por escrito de <strong>60 días</strong> por cualquiera de las partes. La resolución no afectará los derechos sobre clientes ya registrados con anterioridad.</span>
  </div>

  <!-- Clause 8 -->
  <div class="clause">
    <h3>8. Governing Law / Ley Aplicable</h3>
    <p>This agreement is governed by the laws of Spain. Any disputes shall be submitted exclusively to the Courts of Alicante, Spain.</p>
    <span class="lang-divider">Este acuerdo se rige por la legislación española. Cualquier controversia se someterá exclusivamente a los Juzgados y Tribunales de Alicante, España.</span>
  </div>

  <!-- Signatures -->
  <div class="signatures">
    <h3 style="text-align:center; border:none; margin-bottom:16pt;">Signatures / Firmas</h3>
    <table>
      <tr>
        <td style="width:48%; vertical-align:top; padding:12pt;">
          <strong>${cfg.sigHeaderA}</strong>
          <br><br>
          <div class="sig-line" style="margin-top:30pt;"></div>
          <p class="sig-field">Signature / Firma</p>
          <br>
          <div class="sig-line"></div>
          <p class="sig-field">Print Name / Nombre: <strong>${esc(signerName)}</strong></p>
          <br>
          <div class="sig-line"></div>
          <p class="sig-field">Role / Cargo: <strong>${esc(isTemplate ? cfg.sigDefaultTitle : cfg.sigDefaultTitle)}</strong></p>
          ${realtorAckBlockHtml}
          <br>
          <div class="sig-line"></div>
          <p class="sig-field">Date / Fecha: ___________________________</p>
        </td>
        <td style="width:4%; border:none; background:none;"></td>
        <td style="width:48%; vertical-align:top; padding:12pt;">
          <strong>Party B — Megagestión (RE/MAX Inmomás)</strong>
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
    Megagestión Servicios Inmobiliarios S.L. (RE/MAX Inmomás) &bull; Carrer Conrado del Campo 16, 03204, Elche (Alicante), Spain &bull; CIF: B-54829767 &bull; jose.martinez@remax.es &bull; +34 647 86 19 68<br>
    &copy; ${new Date().getFullYear()} Megagestión Servicios Inmobiliarios. All Rights Reserved / Reservados todos los derechos.
  </div>

</body>
</html>`;

    // Build clean filename
    const slugSource = isTemplate
      ? 'Plantilla'
      : (((targetRole === 'realtor_broker' || targetRole === 'realtor_direct') && agentName) ? agentName : (cd.companyLegalName || user.agencyName || `${user.firstName || ''}_${user.lastName || ''}` || 'Partner'))
          .replace(/[^a-zA-Z0-9À-ÿ]+/g, '_')
          .replace(/^_+|_+$/g, '');

    const fileName = `${cfg.filePrefix}_${slugSource}_${new Date().toISOString().slice(0,10)}.doc`;

    // Preview mode: show the agreement inside a modal (read-only) with an optional download button
    if (options && options.preview) {
      App._lastAgreementPreview = { userData, agentData };
      const iframeId = 'agreement-preview-frame';
      if (App.utils && typeof App.utils.showModal === 'function') {
        App.utils.showModal({
          title: `👁️ ${esc(cfg.docTitleEs)}`,
          className: 'modal--wide',
          body: `<iframe id="${iframeId}" title="Vista previa del acuerdo" style="width:100%; height:70vh; border:1px solid #e5e7eb; border-radius:8px; background:#fff;"></iframe>`,
          footer: `
            <button type="button" class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Cerrar / Close</button>
            <button type="button" class="btn btn-primary btn-sm" style="margin-left:0.5rem;" onclick="App.generateReferralAgreementDoc(App._lastAgreementPreview.userData, App._lastAgreementPreview.agentData)">⬇️ Descargar Word (.doc)</button>
          `
        });
        const frame = document.getElementById(iframeId);
        if (frame) frame.srcdoc = html;
      } else {
        const w = window.open('', '_blank');
        if (w) { w.document.open(); w.document.write(html); w.document.close(); }
      }
      return;
    }

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    if (App.utils && typeof App.utils.showToast === 'function') {
      App.utils.showToast(`📄 ${cfg.toastLabel}`, 'success');
    }
  };

})();
