#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Transforms dossier.html to 4-language system:
  ES (España 🇪🇸) | EN-US (EE.UU. 🇺🇸) | EN-CA (Canada 🇨🇦) | FR (France 🇫🇷)
- EN-CA and FR have Canadian data/framing
- ES and EN-US have US/Spain-international framing
- Flag buttons in the control bar
"""

import re

with open('dossier.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ================================================================
# STEP 1: UPDATE CSS — 4-language visibility rules
# ================================================================
old_css = """body.lang-fr .lang-en-ca { display: none !important; }
body.lang-en-ca .lang-fr { display: none !important; }"""

new_css = """/* === 4-LANGUAGE VISIBILITY RULES === */
body.lang-es .lang-en, body.lang-es .lang-fr, body.lang-es .lang-en-ca { display: none !important; }
body.lang-en .lang-es, body.lang-en .lang-fr, body.lang-en .lang-en-ca { display: none !important; }
body.lang-fr .lang-es, body.lang-fr .lang-en, body.lang-fr .lang-en-ca { display: none !important; }
body.lang-en-ca .lang-es, body.lang-en-ca .lang-en, body.lang-en-ca .lang-fr { display: none !important; }"""

html = html.replace(old_css, new_css)
print("✅ CSS updated")

# ================================================================
# STEP 2: CONTROL BAR — 4 flag buttons & title
# ================================================================
old_bar = '''        <span class="lang-fr">Guide d'Investissement et d'Achat</span>
        <span class="lang-en-ca">Investment &amp; Buying Guide</span>'''

new_bar = '''        <span class="lang-es">Guía de Inversión y Compra</span>
        <span class="lang-en">Investment &amp; Buying Guide</span>
        <span class="lang-fr">Guide d'Investissement et d'Achat</span>
        <span class="lang-en-ca">Investment &amp; Buying Guide</span>'''

html = html.replace(old_bar, new_bar)

old_buttons = """      <button class="btn-lang" id="btn-fr" onclick="setLang('fr')">FR</button>
      <button class="btn-lang" id="btn-en-ca" onclick="setLang('en-ca')">EN-CA</button>"""

new_buttons = """      <button class="btn-lang" id="btn-es" onclick="setLang('es')" title="Español">🇪🇸</button>
      <button class="btn-lang" id="btn-en" onclick="setLang('en')" title="English (US)">🇺🇸</button>
      <button class="btn-lang" id="btn-en-ca" onclick="setLang('en-ca')" title="English (Canada)">🇨🇦</button>
      <button class="btn-lang" id="btn-fr" onclick="setLang('fr')" title="Français">🇫🇷</button>"""

html = html.replace(old_buttons, new_buttons)
print("✅ Control bar updated")

# ================================================================
# STEP 3: HELP BANNER
# ================================================================
old_help = """    <span class="lang-fr">💡 Pour une meilleure qualité, utilisez <strong>Enregistrer en PDF</strong> dans la boîte de dialogue d'impression · Format <strong>A4</strong> · Marges <strong>Aucune</strong></span>
    <span class="lang-en-ca">💡 For best quality, use <strong>Save as PDF</strong> in the print dialog · Format <strong>A4</strong> · Margins <strong>None</strong></span>"""

new_help = """    <span class="lang-es">💡 Para mejor calidad, use <strong>Guardar como PDF</strong> en el diálogo de impresión · Formato <strong>A4</strong> · Márgenes <strong>Ninguno</strong></span>
    <span class="lang-en">💡 For best quality, use <strong>Save as PDF</strong> in the print dialog · Format <strong>A4</strong> · Margins <strong>None</strong></span>
    <span class="lang-fr">💡 Pour une meilleure qualité, utilisez <strong>Enregistrer en PDF</strong> dans la boîte de dialogue d'impression · Format <strong>A4</strong> · Marges <strong>Aucune</strong></span>
    <span class="lang-en-ca">💡 For best quality, use <strong>Save as PDF</strong> in the print dialog · Format <strong>A4</strong> · Margins <strong>None</strong></span>"""

html = html.replace(old_help, new_help)

old_print = """        <span class="lang-fr">📥 Télécharger PDF</span>
        <span class="lang-en-ca">📥 Download PDF</span>"""
new_print = """        <span class="lang-es">📥 Descargar PDF</span>
        <span class="lang-en">📥 Download PDF</span>
        <span class="lang-fr">📥 Télécharger PDF</span>
        <span class="lang-en-ca">📥 Download PDF</span>"""
html = html.replace(old_print, new_print)

old_print2 = """        <span class="lang-fr">🖨️ Imprimer</span>
        <span class="lang-en-ca">🖨️ Print</span>"""
new_print2 = """        <span class="lang-es">🖨️ Imprimir</span>
        <span class="lang-en">🖨️ Print</span>
        <span class="lang-fr">🖨️ Imprimer</span>
        <span class="lang-en-ca">🖨️ Print</span>"""
html = html.replace(old_print2, new_print2)
print("✅ Help banner & buttons updated")

# ================================================================
# STEP 4: BODY class — default to Spanish
# ================================================================
html = html.replace('<body class="lang-fr">', '<body class="lang-es">')
print("✅ Default body class set to lang-es")

# ================================================================
# STEP 5: Full bilingual content map — FR text → ES text
#         Used to insert lang-es spans alongside lang-fr spans
# ================================================================
fr_to_es = {
    # COVER
    "Conseil International": "Asesoría Internacional",
    "Guide Complet<br>pour Acheter<br>Votre Bien en Espagne": "Guía Completa<br>para Comprar tu<br>Casa en España",

    # PAGE 2 — LIFESTYLE
    "Style de Vie et Connectivité": "Estilo de Vida y Conectividad",
    "Bienvenue": "Bienvenidos",
    "Style de Vie<br>et Connectivité": "Estilo de Vida<br>y Conectividad",
    "La Costa Blanca a été reconnue par l'Organisation Mondiale de la Santé comme l'une des régions au climat le plus sain de la planète.":
        "La Costa Blanca ha sido reconocida por la Organización Mundial de la Salud como una de las regiones con el clima más saludable del planeta.",
    "De la vibrante ville d'Alicante à l'élégance de Jávea, en passant par la moderne Benidorm et l'historique Elche — chaque coin de la Costa Blanca offre une qualité de vie incomparable. Ici, le style de vie méditerranéen n'est pas un luxe : c'est le quotidien. Marchés en plein air avec des produits frais du jour, promenades au bord de la mer au coucher du soleil, dîners en terrasse avec la brise marine, et une communauté internationale qui vous fait vous sentir chez vous dès le premier jour.":
        "Desde la vibrante ciudad de Alicante hasta la elegancia de Jávea, pasando por la moderna Benidorm y la histórica Elche — cada rincón de la Costa Blanca ofrece una calidad de vida inigualable. Aquí, el estilo de vida mediterráneo no es un lujo: es lo cotidiano. Mercados al aire libre con productos frescos del día, paseos junto al mar al atardecer, cenas en terrazas con brisa marina, y una comunidad internacional que te hace sentir en casa desde el primer día.",
    "L'Espagne occupe la première place du classement Bloomberg des pays les plus sains du monde, et la province d'Alicante en est le joyau côtier. Avec plus de 320 jours de soleil par an, un coût de la vie 40 à 60 % inférieur à celui du Canada, et des infrastructures de santé de premier ordre, la Costa Blanca est la destination choisie par des milliers de familles internationales chaque année.":
        "España ocupa el primer puesto del ranking Bloomberg de los países más saludables del mundo, y la provincia de Alicante es su joya costera. Con más de 320 días de sol al año, un coste de vida un 40-60% inferior al de Estados Unidos o Canadá, y una infraestructura sanitaria de primer nivel, la Costa Blanca es el destino elegido por miles de familias internacionales cada año.",
    "Jours de Soleil / An": "Días de Sol / Año",
    "Temp. Moy. Annuelle": "Temp. Media Anual",
    "Longueur du Littoral": "Línea de Costa",
    "Comparaison des Températures (°C)": "Comparativa de Temperaturas (°C)",
    "Jan": "Ene",
    "Avr": "Abr",
    "✈️ Connectivité Internationale": "✈️ Conectividad Internacional",
    "Vol direct depuis": "Vuelo directo desde",
    "Toronto : ~9h": "Toronto: ~9h",
    "Montréal : ~9.5h": "Montréal: ~9.5h",
    "Vancouver : ~12h": "Vancouver: ~12h",
    "avec correspondance": "con escala / with connection",
    "New York : ~9.5h": "New York: ~9.5h",
    "Los Angeles : ~12h": "Los Angeles: ~12h",
    "Miami : ~9.5h": "Miami: ~9.5h",
    "Aéroport d'Alicante-Elche : 60+ routes directes internationales": "Alicante-Elche Airport: 60+ rutas directas internacionales",

    # PAGE 3 — WHY ALICANTE
    "Pourquoi Alicante ?": "¿Por qué Alicante?",
    "Votre Nouveau Foyer": "Tu Nuevo Hogar",
    "Pourquoi Alicante ?<br>La Costa Blanca<br>est Votre Destination": "¿Por qué Alicante?<br>La Costa Blanca<br>es tu Destino",
    "Qualité de Vie": "Calidad de Vida",
    "Infrastructures": "Infraestructura",
    "Rendement": "Retorno de Inversión",
    "Communauté Internationale": "Comunidad Internacional",
    "ans": "años",
    "de soleil par an": "de sol al año",
    "moins cher qu'aux États-Unis": "más barato que EE.UU.",
    "rentabilité locative saisonnière": "rentabilidad alquiler vacacional",
    "résidents étrangers": "residentes extranjeros",
    "Alicante dispose de l'un des meilleurs systèmes de santé publique d'Europe, d'hôpitaux privés internationaux, d'écoles bilingues et d'universités reconnues mondialement.":
        "Alicante cuenta con uno de los mejores sistemas sanitarios públicos de Europa, hospitales privados internacionales, colegios bilingües y universidades reconocidas mundialmente.",
    "La Costa Blanca est le foyer de plus de 100 000 résidents anglophones, avec des clubs de golf, des marinas, des restaurants internationaux et une scène sociale expatriée dynamique.":
        "La Costa Blanca es el hogar de más de 100.000 residentes de habla inglesa, con clubs de golf, marinas, restaurantes internacionales y una vibrante escena social expatriada.",
    "La province d'Alicante a enregistré une croissance immobilière de 8,3 % en 2024, portée par une demande soutenue de la part d'acheteurs européens, nord-américains et latino-américains.":
        "La provincia de Alicante registró un crecimiento inmobiliario del 8.3% en 2024, con una demanda sostenida por compradores europeos, norteamericanos y latinoamericanos.",
    "Pourquoi Alicante ?<br>Votre Nouveau Foyer": "¿Por qué Alicante?<br>Tu Nuevo Hogar",
    "Plus de 200 km de côte aux eaux cristallines. San Juan, Postiguet et La Granadella parmi les plus belles d'Europe.":
        "Más de 200 km de costa con aguas cristalinas. San Juan, Postiguet y La Granadella entre las mejores de Europa.",
    "Gastronomie Méditerranéenne": "Gastronomía Mediterránea",
    "Restaurants étoilés Michelin, fruits de mer frais au quotidien, riz mondialement reconnu et vins de l'A.O.P. Alicante.":
        "Restaurantes con Estrella Michelin, marisco fresco diario, arroces de fama mundial y vinos de la D.O. Alicante.",
    "Santé de Premier Ordre": "Sanidad de Primer Nivel",
    "Espagne N°1 pays le plus sain (Bloomberg). Santé publique et privée à une fraction du coût au Canada. Hôpital Vithas à Alicante.":
        "España Nº1 país más saludable (Bloomberg). Sanidad pública y privada a una fracción del coste de EE.UU. Hospital Vithas en Alicante.",
    "Culture et Tradition": "Cultura y Tradición",
    "Hogueras de San Juan, Maures et Chrétiens. Musée Archéologique MARQ. Patrimoine romain et mauresque.":
        "Hogueras de San Juan, Moros y Cristianos. Museo Arqueológico MARQ. Herencia romana y morisca.",
    '"S\'installer à Alicante a été la meilleure décision que nous ayons prise. La qualité de vie ici est tout simplement incomparable."':
        '"Mudarnos a Alicante fue la mejor decisión que hemos tomado. La calidad de vida aquí es simplemente incomparable."',
    "Plages Primées": "Playas Premiadas",

    # PAGE 4 — COST COMPARISON
    "Comparaison des Coûts": "Comparativa de Costes",
    "Réalité Financière": "Realidad Financiera",
    "Comparaison des Coûts<br>et Réalité Financière": "Comparativa de Costes<br>y Realidad Financiera",
    "Votre dollar canadien va significativement plus loin sur la Costa Blanca. Il ne s'agit pas seulement du prix — c'est d'un niveau de vie supérieur pour une fraction du coût.":
        "Tu dólar o dólar canadiense rinde significativamente más en la Costa Blanca. No se trata solo de precio, sino de un nivel de vida superior por una fracción del coste.",
    "Élément": "Concepto",
    "🇪🇸 Espagne": "🇪🇸 España",
    "Économies": "Ahorro",
    "Assurance Santé Privée": "Seguro Médico Privado",
    "/mois": "/mes",
    "Dîner Gastronomique pour Deux": "Cena Gourmet para Dos",
    "Charges de Copropriété": "Cuota de Comunidad",
    "Taxe Foncière Annuelle (IBI)": "Impuesto Anual (IBI)",
    "/an": "/año",
    "Maison 3 Ch. de Qualité": "Casa 3 Hab. de Calidad",
    "à partir de": "desde",
    "Économies sur votre coût de vie": "Ahorro en tu coste de vida",
    '"Avec le même budget de retraite ou de travail à distance, sur la Costa Blanca, vous vivez avec un niveau de vie nettement supérieur."':
        '"Con el mismo presupuesto de jubilación o trabajo remoto, en la Costa Blanca vives con un nivel de vida significativamente superior."',
    "💶 Décomposition des Frais d'Achat — Costa Blanca (Valence)": "💶 Desglose de Costes de Compra — Costa Blanca (Valencia)",
    "🏠 Bien Immobilier de Revente": "🏠 Propiedad de Segunda Mano",
    "Prix d'achat": "Precio de compra",
    "ITP (Taxe de Transmission) : 9 %": "ITP (Impuesto Transmisiones): 9%",
    "Frais de Notaire": "Notaría",
    "Frais d'Inscription au Registre": "Registro de la Propiedad",
    "Transfert des Services": "Suministros",
    "Honoraires d'Avocat": "Honorarios abogado",
    "TOTAL ESTIMÉ": "TOTAL ESTIMADO",
    "🏗️ Construction Neuve": "🏗️ Obra Nueva",
    "TVA : 10 %": "IVA: 10%",
    "Droits de Timbre : 1,4 %": "Actos Jurídicos Doc.: 1.4%",
    "Registre": "Registro",
    "* Chiffres indicatifs basés sur la législation en vigueur · Source : Fuster &amp; Associates Guide d'Achat Immobilier 2026":
        "* Cifras orientativas basadas en la normativa vigente · Fuente: Fuster &amp; Associates 2026 Property Purchase Guide",

    # PAGE 5 — BUYING PROCESS
    "Processus d'Achat": "Proceso de Compra",
    "Étape par Étape": "Paso a Paso",
    "Le Processus d'Achat<br>Étape par Étape": "El Proceso de Compra<br>Paso a Paso",
    "NIE — Numéro d'Identité pour Étrangers": "NIE — Número de Identidad de Extranjero",
    "Document obligatoire pour toute transaction en Espagne. Nous le gérons pour vous.": "Documento obligatorio para cualquier transacción en España. Lo gestionamos por ti.",
    "semaines": "semanas",
    "Compte Bancaire": "Cuenta Bancaria",
    "Ouverture d'un compte dans une banque espagnole pour gérer les paiements et transferts.": "Apertura de cuenta en banco español para gestionar pagos y transferencias.",
    "jours": "días",
    "Stratégie de Recherche": "Estrategia de Búsqueda",
    "Nous définissons ensemble votre budget, localisation idéale et type de bien.": "Definimos juntos tu presupuesto, ubicación ideal y tipo de propiedad.",
    "Sélection de Biens": "Selección de Propiedades",
    "Nous vous présentons une sélection de biens correspondant à vos critères.": "Te presentamos una selección curada de propiedades que se ajustan a tus criterios.",
    "Diligence Raisonnable Juridique": "Due Diligence Legal",
    "Vérification des charges, dettes, permis et titres de propriété par Fuster &amp; Associates.": "Verificación de cargas, deudas, permisos y titularidad por Fuster &amp; Associates.",
    "semaine": "semana",
    "Contrat d'Arrhes": "Contrato de Arras",
    "Contrat de réservation avec dépôt de 10 %. Protège légalement les deux parties.": "Contrato de reserva con depósito del 10%. Protege ambas partes legalmente.",
    "jour": "día",
    "Acte Notarié": "Escritura Notarial",
    "Signature devant notaire public. Inscription au Registre de la Propriété.": "Firma ante notario público. Inscripción en el Registro de la Propiedad.",
    "Remise des Clés 🔑": "Entrega de Llaves 🔑",
    "Félicitations ! Votre nouvelle vie en Méditerranée commence ici.": "¡Felicidades! Tu nueva vida en el Mediterráneo comienza aquí.",
    "Même jour": "Mismo día",
    "⏱️ Durée totale estimée du processus": "⏱️ Proceso completo estimado",
    "* L'ensemble du processus peut être réalisé par procuration notariée sans présence physique en Espagne.": "* Todo el proceso puede realizarse con poder notarial sin necesidad de presencia física en España.",
    # FAQ
    "❓ Questions Fréquentes sur le Processus (Fuster &amp; Associates)": "❓ Preguntas Frecuentes sobre el Proceso (Fuster &amp; Associates)",
    "Puis-je obtenir un prêt immobilier en tant que non-résident ?": "¿Puedo obtener hipoteca siendo no residente?",
    "Oui. Les banques espagnoles financent jusqu'à 70 % de la valeur. Les frais d'ouverture représentent environ 4–5 % du montant emprunté.":
        "Sí. Bancos españoles financian hasta el 70% del valor. Los costes de apertura son aproximadamente 4–5% del monto prestado.",
    "Quels sont les coûts annuels de la propriété ?": "¿Cuáles son los costes anuales de propiedad?",
    "IBI (taxe foncière) : 300–1 000 € · Impôt des non-résidents : 150–800 € · Charges de copropriété : variable":
        "IBI (impuesto municipal): €300–€1,000 · Impuesto no residentes: €150–€800 · Cuota comunidad: variable",
    "Comment structurer la propriété ?": "¿Cómo estructuro la titularidad?",
    "En nom propre, en copropriété, ou au nom des héritiers. Fuster vous conseille selon votre situation fiscale spécifique.":
        "A nombre propio, en conjunto, o en nombre de sus herederos. Fuster te asesora según tu situación fiscal específica.",
    "Un testament espagnol est-il nécessaire ?": "¿Es necesario un testamento español?",
    "Oui. Il est essentiel pour la planification successorale. Fuster gère sa rédaction et sa procédure notariale.":
        "Sí. Es vital para la planificación hereditaria. Fuster gestiona su redacción y tramitación notarial.",

    # PAGE 6 — VISAS
    "Résidence et Visas": "Residencia y Visados",
    "Voies Légales": "Vías Legales",
    "Résidence, Visas<br>et Voies Légales": "Residencia, Visados<br>y Vías Legales",
    "L'Espagne offre de multiples voies légales permettant aux Canadiens et aux citoyens d'autres pays d'établir leur résidence légale. Notre équipe juridique chez Fuster &amp; Associates vous accompagne tout au long du processus.":
        "España ofrece múltiples vías legales para que ciudadanos de Estados Unidos, Canadá y otros países puedan establecer su residencia legal. Nuestro equipo legal en Fuster &amp; Associates te guía durante todo el proceso.",
    "Visa Nomade Numérique": "Visa Nómada Digital",
    "Pour les travailleurs à distance percevant des revenus hors d'Espagne. Sans impôts locaux sur les revenus étrangers pendant 4 ans.":
        "Para trabajadores remotos con ingresos fuera de España. Sin impuestos locales sobre ingresos extranjeros durante 4 años.",
    "À partir de 2 160 €/an": "Desde €2,160/año",
    "Visa de Retraite / Non-lucratif": "Visa de No Lucrativa",
    "Idéal pour les retraités ou les personnes ayant des revenus passifs. Nécessite de justifier de ressources suffisantes.":
        "Ideal para jubilados o personas con ingresos pasivos. Requiere demostrar medios económicos suficientes.",
    "À partir de 28 800 €/an pour une famille": "Desde €28,800/año familia",
    "Golden Visa (Visa Investisseur)": "Golden Visa (Visa de Inversión)",
    "Investissement minimum de 500 000 € en biens immobiliers. Accès immédiat à la résidence et libre circulation Schengen.":
        "Inversión mínima de €500,000 en inmuebles. Acceso inmediato a residencia y libre circulación Schengen.",
    "Investissement minimum": "Inversión mínima",
    "Nomade Numérique": "Nómada Digital",
    "Revenus à distance": "Ingresos remotos",
    "Non Lucratif": "No Lucrativa",
    "Revenus passifs / Retraite": "Ingresos pasivos / Jubilación",
    "Durée": "Duración",
    "1 an (renouvelable à 3)": "1 año (renovable a 3)",
    "Revenu minimum": "Ingreso mínimo",
    "Max 20 % clients en Espagne": "Max 20% clientes en España",
    "Résidence immédiate": "Residencia inmediata",
    "Libre Schengen": "Libre Schengen",
    "Travailleurs à distance / freelancers": "Trabajadores remotos / freelancers",
    "1 an (renouvelable 2+2)": "1 año (renovable a 2+2)",
    "Ne permet pas de travailler en Espagne": "No permite trabajar en España",
    "🏛️ Autres Voies de Résidence": "🏛️ Otras Vías de Residencia",
    "Le gouvernement espagnol est en train de modifier et d'éliminer progressivement le Golden Visa d'investissement immobilier de 500 000 €. Si vous envisagiez cette voie, consultez notre équipe juridique pour connaître les alternatives actuelles et les délais de transition.":
        "El gobierno español está modificando y progresivamente eliminando la Golden Visa de inversión inmobiliaria de €500.000. Si estabas considerando esta vía, consulta con nuestro equipo legal para conocer las alternativas vigentes y los plazos de transición.",

    # PAGE 7 — TAXATION
    "Fiscalité pour les Non-Résidents": "Fiscalidad para No Residentes",
    "Ce que vous Devez Savoir": "Lo que Debes Saber",
    "Fiscalité<br>pour les Non-Résidents": "Fiscalidad<br>para No Residentes",
    "Lors de l'achat d'un bien immobilier en Espagne, il est essentiel de comprendre les frais liés à la transaction et les impôts récurrents. Nous détaillons ici tous les coûts pour qu'il n'y ait aucune mauvaise surprise.":
        "Al comprar una propiedad en España, es fundamental entender los costes asociados a la transacción y los impuestos recurrentes. Aquí desglosamos todos los costes para que no haya sorpresas.",
    "Impôt sur le Revenu des Non-Résidents (IRNR)": "Impuesto sobre la Renta de No Residentes (IRNR)",
    "Si vous louez le bien : imposition sur les revenus nets (déduction des charges autorisée).":
        "Si alquila la propiedad: se tributa sobre los ingresos netos (deducción de gastos permitida).",
    "Si vous NE louez PAS : imposition sur le revenu imputé (1 % à 2 % de la valeur cadastrale).":
        "Si NO alquila: se tributa sobre la renta imputada (1% - 2% del valor catastral).",
    "Impôt sur les Biens Immobiliers (IBI)": "Impuesto sobre Bienes Inmuebles (IBI)",
    "Taxe foncière municipale annuelle. Calculée sur la valeur cadastrale du bien.":
        "Impuesto municipal anual. Calculado sobre el valor catastral de la propiedad.",
    "Charges de Copropriété": "Cuota de la Comunidad",
    "Frais d'entretien des parties communes. Variable selon la résidence.":
        "Gastos de mantenimiento de zonas comunes. Variable según la urbanización.",
    "Gestion Fiscale avec Fuster": "Gestión Fiscal con Fuster",
    "Dépôt des déclarations fiscales annuelles": "Presentación de declaraciones fiscales anuales",
    "Représentation fiscale auprès des autorités": "Representación fiscal ante Hacienda",
    "Optimisation des retenues et déductions": "Optimización de retenciones y deducciones",
    "Conseil sur la structure de propriété optimale": "Asesoría sobre estructura de propiedad óptima",
    "Planification successorale et testament espagnol": "Planificación de herencia y testamento español",
    "Convention de Double Imposition Canada–Espagne": "Convenio de Doble Imposición EE.UU.–España",
    "La convention bilatérale entre le Canada et l'Espagne évite la double imposition fiscale. Les impôts payés en Espagne peuvent être imputés sur votre déclaration d'impôt fédérale canadienne. Notre partenaire Fuster &amp; Associates vous accompagne dans l'optimisation de votre situation fiscale transfrontalière.":
        "El convenio bilateral entre Estados Unidos y España evita la doble imposición fiscal. Los impuestos pagados en España pueden acreditarse contra tu declaración federal mediante el <strong>Foreign Tax Credit</strong>. Consulta con Fuster &amp; Associates.",
    "📊 Décomposition des Frais d'Achat (Bien de Revente)": "📊 Desglose de Costes (Propiedad de Segunda Mano)",

    # PAGE 8 — PARTNER ECOSYSTEM
    "Écosystème de Valeur": "Ecosistema de Valor",
    "Partenaires Alliés": "Socios Aliados",
    "Écosystème de Valeur<br>et Partenaires Alliés": "Ecosistema de Valor<br>y Socios Aliados",
    "Vous ne serez pas seul. Nous avons constitué une alliance stratégique avec les meilleurs professionnels de chaque domaine pour que votre expérience d'achat soit fluide, sécurisée et sans souci.":
        "No estarás solo. Hemos construido una alianza estratégica con los mejores profesionales de cada área para que tu experiencia de compra sea fluida, segura y sin preocupaciones.",
    "Conseil immobilier complet : visites de biens, analyse de marché, négociation experte et accompagnement personnalisé. 30+ ans, 115+ agents, 4 bureaux sur la Costa Blanca.":
        "Asesoría inmobiliaria integral: tours de propiedades, análisis de mercado, negociación experta y acompañamiento personalizado. 30+ años, 115+ agentes, 4 oficinas en Costa Blanca.",
    "Diligence raisonnable juridique complète, NIE et visas, contrats de vente, optimisation fiscale, successions et testament espagnol. Plus de 25 ans d'expérience et 20 000 clients internationaux accompagnés.":
        "Due diligence legal completa, NIE y visados, contratos de compraventa, optimización fiscal, herencias y testamento español. Más de 25 años y 20.000 clientes internacionales atendidos.",
    "Prêts immobiliers pour non-résidents jusqu'à 70 % LTV. Pré-approbation en 48 heures. Taux compétitifs (fixe et variable). Processus 100 % numérique avec assistance en anglais et en français.":
        "Hipotecas para no residentes hasta el 70% LTV. Pre-aprobación en 48 horas. Tipos competitivos (fijo y variable). Proceso 100% digital con atención en inglés y español.",
    "Gestion complète de la location saisonnière : optimisation du ROI, marketing sur les plateformes internationales, maintenance du bien, check-in/out et assistance aux clients 24h/24 et 7j/7.":
        "Gestión integral de alquiler vacacional: optimización de ROI, marketing en plataformas internacionales, mantenimiento de propiedad, check-in/out y atención al huésped 24/7.",
    "🤝 Un seul point de contact pour tout. <strong style=\"color:var(--accent-gold);\">Vous vous concentrez sur le choix de votre bien. Nous nous occupons du reste.</strong>":
        "🤝 Un solo punto de contacto para todo. <strong style=\"color:var(--accent-gold);\">Tú te enfocas en elegir tu hogar. Nosotros nos encargamos del resto.</strong>",

    # PAGE 9 — CONTACT
    "Contact et Bureaux": "Contacto y Oficinas",
    "Votre Prochaine Étape": "Tu Próximo Paso",
    "Contact et<br>Bureaux de l'Alliance": "Contacto y<br>Oficinas de la Alianza",
    "Cher futur voisin,": "Estimado futuro vecino,",
    "Merci de votre intérêt pour la Costa Blanca et nos services. Chez RE/MAX Inmomás, nous aidons depuis des années des familles du monde entier à trouver leur maison idéale en Méditerranée. Nous comprenons qu'acheter un bien immobilier dans un autre pays est une décision importante — c'est pourquoi nous avons créé un écosystème de professionnels qui vous accompagne à chaque étape.":
        "Gracias por tu interés en la Costa Blanca y en nuestros servicios. En RE/MAX Inmomás llevamos años ayudando a familias de todo el mundo a encontrar su hogar ideal en el Mediterráneo. Entendemos que comprar una propiedad en otro país es una decisión importante — por eso hemos creado un ecosistema de profesionales que te acompaña en cada paso del camino.",
    "Que vous soyez en phase d'exploration ou que vous ayez déjà décidé de franchir le pas : je suis là pour vous aider personnellement. Je vous invite à planifier un appel vidéo sans engagement pour discuter de vos projets et de la façon dont nous pouvons les concrétiser.":
        "No importa si estás en la fase de exploración o ya tienes claro que quieres dar el paso: estoy aquí para ayudarte personalmente. Te invito a agendar una videollamada sin compromiso para hablar de tus planes y cómo podemos hacerlos realidad.",
    "Directeur de l'Expansion Internationale": "Director de Expansión Internacional",
    "🏢 Nos Bureaux": "🏢 Nuestras Oficinas",
    "Prêt à franchir le premier pas ?": "¿Listo para dar el primer paso?",
    "Planifiez Votre Appel Vidéo Gratuit": "Agenda tu Videollamada Gratuita",
    "Tous droits réservés": "Todos los derechos reservados",
    "Ce guide est fourni à titre informatif et ne constitue pas un conseil juridique ou fiscal. Consultez des professionnels qualifiés avant de prendre des décisions d'investissement.":
        "Esta guía es informativa y no constituye asesoría legal o fiscal. Consulte con profesionales cualificados antes de tomar decisiones de inversión.",
}

# Additional FR→ES for visa section
fr_to_es_extra = {
    "<strong>Visa Entrepreneur :</strong> pour lancer une entreprise en Espagne. <strong>Regroupement Familial :</strong> si vous avez de la famille citoyenne UE. <strong>Étudiant → Travailleur :</strong> voie pour les jeunes en programmes d'échange.":
        "<strong>Visa de Emprendedor:</strong> para lanzar un negocio en España. <strong>Reagrupación Familiar:</strong> si tienes familia ciudadana UE. <strong>Estudiante → Trabajador:</strong> vía para jóvenes en programas de intercambio.",
}
fr_to_es.update(fr_to_es_extra)

# ================================================================
# STEP 6: EN-CA → EN-US adjustments
# ================================================================
ca_to_us = {
    # Market framing
    "Your Canadian dollar goes significantly further": "Your US dollar goes significantly further",
    "lower than in Canada": "lower than in the US or Canada",
    "40–60% lower than in Canada": "40-60% lower than in the US",
    "thousands of Canadian and international families": "thousands of international families",
    "Canadians and citizens of the United States and other countries": "citizens of the United States, Canada and other countries",
    "lower than in Canada or the United States": "lower than the US or Canada",
    # Book → Schedule (US phrasing)
    "Book Your Free Video Call": "Schedule Your Free Video Call",
    # Canadian spelling → US spelling (within EN-US spans)
    "colour": "color",
    "centre": "center",
    "organisation": "organization",
    # Tax references
    "Canada–Espagne": "United States–Spain",
    "your Canadian federal tax return": "your federal tax return",
    "Fuster &amp; Associates vous accompagne dans l'optimisation": "Fuster & Associates guides you through",
    "with assistance in English and in French": "with English and Spanish support",
    # Visa section
    "Canadians and citizens of the United States": "citizens of the United States, Canada",
    # Mortgage
    "with English and French support": "with English and Spanish support",
}

# ================================================================
# STEP 7: INSERT lang-es spans before each lang-fr span
#         INSERT lang-en spans before each lang-en-ca span
# ================================================================

def build_es_span(fr_content):
    """Reverse-lookup ES content for a given FR content"""
    return fr_to_es.get(fr_content, None)

def build_en_span(ca_content):
    """Build US English span from Canadian English content with adjustments"""
    us = ca_content
    for ca_text, us_text in ca_to_us.items():
        us = us.replace(ca_text, us_text)
    return us

# Process all lang-fr spans → add lang-es before them
count_es = 0
not_found = []

def add_es_before_fr(match):
    global count_es
    fr_content = match.group(1)
    es_content = build_es_span(fr_content)
    if es_content:
        count_es += 1
        return f'<span class="lang-es">{es_content}</span>\n        <span class="lang-fr">{fr_content}</span>'
    else:
        not_found.append(fr_content[:80])
        # Keep as-is, just add empty placeholder
        return f'<span class="lang-fr">{fr_content}</span>'

# Process lang-fr spans
html = re.sub(r'<span class="lang-fr">(.*?)</span>', add_es_before_fr, html, flags=re.DOTALL)
print(f"✅ lang-es spans inserted: {count_es}")
print(f"⚠️  FR spans without ES match: {len(not_found)}")
for nf in not_found:
    print(f"  - {nf}")

# Process all lang-en-ca spans → add lang-en before them
count_en = 0

def add_en_before_ca(match):
    global count_en
    ca_content = match.group(1)
    en_content = build_en_span(ca_content)
    count_en += 1
    return f'<span class="lang-en">{en_content}</span>\n        <span class="lang-en-ca">{ca_content}</span>'

html = re.sub(r'<span class="lang-en-ca">(.*?)</span>', add_en_before_ca, html, flags=re.DOTALL)
print(f"✅ lang-en spans inserted: {count_en}")

# ================================================================
# STEP 8: UPDATE JavaScript
# ================================================================
old_js = """  // Read preference from hash or localStorage
  function getPreferredLang() {
    var hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'fr' || hash === 'en-ca') return hash;
    var stored = localStorage.getItem('dossier-lang');
    if (stored === 'fr' || stored === 'en-ca') return stored;
    // Try browser language
    var nav = (navigator.language || '').toLowerCase();
    if (nav.indexOf('fr') === 0) return 'fr';
    return 'fr'; // default to French
  }

  function applyLang(lang) {
    document.body.classList.remove('lang-fr', 'lang-en-ca');
    document.body.classList.add('lang-' + lang);
    localStorage.setItem('dossier-lang', lang);

    // Update button states
    var btnFr = document.getElementById('btn-fr');
    var btnEnCa = document.getElementById('btn-en-ca');
    if (btnFr) {
      btnFr.classList.toggle('active', lang === 'fr');
    }
    if (btnEnCa) {
      btnEnCa.classList.toggle('active', lang === 'en-ca');
    }
  }

  // Global function for buttons
  window.setLang = function(lang) {
    applyLang(lang);
    window.location.hash = lang;
  };

  // Apply on load
  applyLang(getPreferredLang());

  // Listen for hash changes
  window.addEventListener('hashchange', function() {
    var hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'fr' || hash === 'en-ca') {
      applyLang(hash);
    }
  });"""

new_js = """  const VALID_LANGS = ['es', 'en', 'fr', 'en-ca'];

  function getPreferredLang() {
    var hash = window.location.hash.replace('#', '').toLowerCase();
    if (VALID_LANGS.includes(hash)) return hash;
    var stored = localStorage.getItem('dossier-lang');
    if (stored && VALID_LANGS.includes(stored)) return stored;
    // Auto-detect from browser
    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.indexOf('fr') === 0) return 'fr';
    if (nav.indexOf('es') === 0) return 'es';
    if (nav.indexOf('en-ca') === 0 || nav === 'en-ca') return 'en-ca';
    return 'es'; // default to Spanish
  }

  function applyLang(lang) {
    if (!VALID_LANGS.includes(lang)) lang = 'es';
    document.body.classList.remove('lang-es', 'lang-en', 'lang-fr', 'lang-en-ca');
    document.body.classList.add('lang-' + lang);
    localStorage.setItem('dossier-lang', lang);

    // Update button active states
    VALID_LANGS.forEach(function(l) {
      var btn = document.getElementById('btn-' + l);
      if (btn) btn.classList.toggle('active', lang === l);
    });
  }

  window.setLang = function(lang) {
    applyLang(lang);
    window.location.hash = lang;
  };

  applyLang(getPreferredLang());

  window.addEventListener('hashchange', function() {
    var hash = window.location.hash.replace('#', '').toLowerCase();
    if (VALID_LANGS.includes(hash)) applyLang(hash);
  });"""

html = html.replace(old_js, new_js)
print("✅ JavaScript updated")

# ================================================================
# STEP 9: Update <title> to be multilingual
# ================================================================
old_title = '<title>Investment &amp; Buying Guide · RE/MAX Inmomás International</title>'
new_title = '<title>Guía de Compra · Buying Guide · Guide d\'Achat · RE/MAX Inmomás International</title>'
html = html.replace(old_title, new_title)

# ================================================================
# STEP 10: FIX BUTTON STYLE — make flags display better
# ================================================================
# Update btn-lang CSS to accommodate emoji flags
old_btn_css = """.btn-lang {"""
new_btn_css = """.btn-lang {
  font-size: 18px;
  line-height: 1;"""

# Only add if not already there
if 'font-size: 18px' not in html:
    html = html.replace('.btn-lang {', '.btn-lang {\n  font-size: 18px;\n  line-height: 1;', 1)

# ================================================================
# WRITE OUTPUT
# ================================================================
with open('dossier.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("\n✅ 4-language transformation complete!")
print("  🇪🇸 ES (España) — español original")
print("  🇺🇸 EN (EE.UU.) — US English with US data")
print("  🇨🇦 EN-CA (Canada) — Canadian English with CA data")
print("  🇫🇷 FR (France) — français avec données Canada")
