const planoAcao = [{
    'ERB-CT': [{
        planoId: '1',
        indexA: 0,
        indexQ: 4,
        question: 'Foi identificado a presença, concertina, arame farpado e/ou outro tipo de proteção, instalados sobre a área cercada do perímetro?',
        nomeTecnico: 'Concertina ou Tela Laminada',
        apicabilidade: 'Barreira Perimetral',
        ambiente: ['Greenfield'],
        especificacao: 'Barreira de proteção em forma helicoidal em aço galvanizado, inox ou galvamule com no mínimo 8 pontos e no máximo 10 pontos perfurantes. Podendo ser fornecida nos diâmetros 300mm, 450mm, 600mm, 730mm ou sob pedida.  Deve ser fixada a cada 1,5 metro com grampos de aço inox, em pontos ancorados (preferível chumbados) no muro pelo lado de dentro, visando a proteção contra a invasão ao patrimônio.',
        tipo: ['Médio', 'Alto']
    }, {
        planoId: '2',
        indexA: 0,
        indexQ: 5,
        question: 'Foi identificado que os muros de alvenaria e/ou alambrados, que cercam o perímetro, têm a altura mínima de 2,50m em conjunto com a proteção instalada sobre a edificação (concertina, arame farpado e/ou outro tipo de proteção)?',
        nomeTecnico: 'Muro de Alvenaria',
        apicabilidade: 'Barreira Perimetral',
        ambiente: ['Greenfield'],
        especificacao: 'Muro de alvenaria com a altura mínima de 2,50 metros, protegendo todo circundando todo o perímetro do site, de forma a impedir a invasão ao patrimônio.',
        tipo: ['Alto']
    }, {
        planoId: '3',
        indexA: 0,
        indexQ: 6,
        question: '',
        nomeTecnico: 'Gradil Perimetral para sites permanentes',
        apicabilidade: 'Barreira perimetral para sites Fixos',
        ambiente: ['Greenfield'],
        especificacao: 'Gradil com altura mínima de 2,10. Confeccionado em barra chata com espessura de 25x1,50mm, com espaçamento horizontal de 10 em 10cm e vertical de 50 em 50cm. Tubos de aço SAE 1020 utilizados nas portas e junções. Fixação por sapatas de concreto, medindo 50x50x50cm com distanciamento 3m entre elas.',
        tipo: ['Baixo', 'Médio', 'Alto']
    }, {
        planoId: '5',
        indexA: 1,
        indexQ: 6,
        question: '',
        nomeTecnico: 'Modulo Box',
        apicabilidade: 'Banco de Baterias',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: 'Caixa Box confeccionada em PRFV-PC com capacidade para acondicionar elementos de baterias 55Ah/100Ah/150Ah/170Ah/200Ah/500Ah/600Ah Entre outras de 2VDC/12VDC (Terminal Padrão, Terminal Frontal, entre outros), compondo um banco de baterias único de 4V/8VDC/24VDC ou 48VDC, incluindo dois polos destinados a alimentação. Deve ser confeccionado em Polímero Reforçado Fibra de Vidro – PC, onde deverão ser envelopados os elementos de bateria para compor um banco de baterias único blindado. Os elementos de baterias deverão ser envoltos em base de polímero bi componente Ester-Vinílico, inclusive seus polos, mantendo externos somente 2 (dois) polos (+/-) e tubo de respiro. O processo de fusão não deverá permitir a separação das baterias sem gerar danos físicos aos elementos, danificando severamente as baterias, devendo perder completamente a utilidade operacional como acumuladores de energia e principalmente atrativo comercial.',
        tipo: ['Baixo', 'Médio', 'Alto']
    }, {
        planoId: '6',
        indexA: 0,
        indexQ: 3,
        question: '',
        nomeTecnico: 'Fechadura e Cadeado Bluetooth',
        apicabilidade: 'Proteção de Sites em geral',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: 'Dispositivo homologado pela segurança Patrimonial (UNILOCK Promont), devendo ser disponibilizado com licença de operação; devem ter ID único; Códigos de acesso com dupla criptografia 256 bits; Quantidade de chaves ilimitada; Temperatura de trabalho -10°C até 70°C; Tensão de alimentação externa direta 18 a 72VDC; Alimentação de emergência através de porta USB; Baterias recarregáveis, internas, com capacidade de duração mínima de 5 anos; Somente permite abertura através das chaves autorizadas com critérios de verificação; Permite remover chaves do celular remotamente, sem interferência do usuário; Sistema autônomo de retenção do travamento quando detecção de porta aberta; Grau de proteção IP 55; Nível de segurança seis (6) em conformidade com a norma EN12320; Porta Fast-Ethernet (possibilita operação On-line comunicação direta com o servidor); Para os cadeados devem contar com a proteção Hasplock, visando impedir que o cadeado seja facilmente cortado ou danificado. com o servidor); Para os cadeados devem contar com a proteção Hasplock, visando impedir que o cadeado seja facilmente cortado ou danificado.',
        tipo: ['Baixo', 'Médio', 'Alto']
    }, {
        planoId: '6',
        indexA: 1,
        indexQ: 2,
        question: '',
        nomeTecnico: 'Fechadura e Cadeado Bluetooth',
        apicabilidade: 'Proteção de Sites em geral',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: 'Dispositivo homologado pela segurança Patrimonial (UNILOCK Promont), devendo ser disponibilizado com licença de operação; devem ter ID único; Códigos de acesso com dupla criptografia 256 bits; Quantidade de chaves ilimitada; Temperatura de trabalho -10°C até 70°C; Tensão de alimentação externa direta 18 a 72VDC; Alimentação de emergência através de porta USB; Baterias recarregáveis, internas, com capacidade de duração mínima de 5 anos; Somente permite abertura através das chaves autorizadas com critérios de verificação; Permite remover chaves do celular remotamente, sem interferência do usuário; Sistema autônomo de retenção do travamento quando detecção de porta aberta; Grau de proteção IP 55; Nível de segurança seis (6) em conformidade com a norma EN12320; Porta Fast-Ethernet (possibilita operação On-line comunicação direta com o servidor); Para os cadeados devem contar com a proteção Hasplock, visando impedir que o cadeado seja facilmente cortado ou danificado. com o servidor); Para os cadeados devem contar com a proteção Hasplock, visando impedir que o cadeado seja facilmente cortado ou danificado.',
        tipo: ['Baixo', 'Médio', 'Alto']
    }, {
        planoId: '6',
        indexA: 1,
        indexQ: 13,
        question: '',
        nomeTecnico: 'Fechadura e Cadeado Bluetooth',
        apicabilidade: 'Proteção de Sites em geral',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: 'Dispositivo homologado pela segurança Patrimonial (UNILOCK Promont), devendo ser disponibilizado com licença de operação; devem ter ID único; Códigos de acesso com dupla criptografia 256 bits; Quantidade de chaves ilimitada; Temperatura de trabalho -10°C até 70°C; Tensão de alimentação externa direta 18 a 72VDC; Alimentação de emergência através de porta USB; Baterias recarregáveis, internas, com capacidade de duração mínima de 5 anos; Somente permite abertura através das chaves autorizadas com critérios de verificação; Permite remover chaves do celular remotamente, sem interferência do usuário; Sistema autônomo de retenção do travamento quando detecção de porta aberta; Grau de proteção IP 55; Nível de segurança seis (6) em conformidade com a norma EN12320; Porta Fast-Ethernet (possibilita operação On-line comunicação direta com o servidor); Para os cadeados devem contar com a proteção Hasplock, visando impedir que o cadeado seja facilmente cortado ou danificado. com o servidor); Para os cadeados devem contar com a proteção Hasplock, visando impedir que o cadeado seja facilmente cortado ou danificado.',
        tipo: ['Baixo', 'Médio', 'Alto']
    }, {
        planoId: '7',
        indexA: 1,
        indexQ: 9,
        question: '',
        nomeTecnico: 'Cinta de Proteção',
        apicabilidade: 'IDU(s) em Racks 19 e 21 polegadas',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: 'Confeccionada em chapa de aço de 3/16” (mínimo), reforçada com pelo menos 02 barras longitudinais de 3/8” (mínimo), com sistema de fixação ao gabinete através de parafusos codificados de 3/8” (mínimo), com código exclusivo para uso da Telefônica do Brasil. Os parafusos deverão ter proteção contra o acesso direto aos mesmos, ficando completamente embutidos no sistema de fixação da cinta. A cinta de proteção deverá ter o acabamento com pintura eletrostática (Epóxi) ou com galvanização a fogo, com laudo específico para tal. Cinta de proteção para equipamentos DWDM, Cisco, Nokia, Padtec e outros Cinta de proteção frontal para rádio PDH (Huawei, Nec, Alcatel, Siae, Ericsson, Petha e outros) Cinta de proteção frontal para caixas (Huawei, Cisco, Tellabs, Nokia)',
        tipo: ['Médio', 'Alto']
    }, {
        planoId: '8',
        indexA: 1,
        indexQ: 10,
        question: '',
        nomeTecnico: 'Cofre Indoor',
        apicabilidade: 'Roteadores',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: 'O cofre deverá ser construído sobre o rack existente a ser protegido e fixado (chumbado) no piso e parede, ou piso e estiramentos da sala de forma a impedir o acesso direto ao equipamento mitigando assim a possível tentativa de vandalismo ou furto deste. Deverá ser construído todo em chapa reforçada de 3/16” mínimo, com longarinas internas com espessura não inferior a 3/8” (mínimo), com sistema de fixação ao gabinete através de parafusos codificados de 3/8” (mínimo), com código exclusivo para uso da Telefônica do Brasil. Deve permitir um bom fluxo de ventilação interno e possuir uma porta frontal dotada de porta cadeado eletrônico (tipo Bluetooth) com fecho duplo e dobradiças internas e protegidas. Toda a estrutura deve ser construída de forma a impossibilitar a inserção de alavancas. Deve ainda possuir livre acesso para o cabeamento de dados e energia, tanto pelo topo como pela base.',
        tipo: ['Alto']
    }, {
        planoId: '9',
        indexA: 1,
        indexQ: 10,
        question: '',
        nomeTecnico: 'Cofre Outdoor',
        apicabilidade: 'Roteadores',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: 'O cofre deverá ser construído com rack interno do tipo 19” com nível de vedação IP55 ou superior dotado de sistema de ventilação forçado e filtros de ar do tipo GORE. Construído e chumbado sobre base de concreto a fim de impossibilitar seu tombamento ou ainda a utilização de alavanca. Deverá ser construído todo em chapa reforçada do tipo dupla de 3/16” mínimo, com longarinas internas com espessura não inferior a 3/8” (mínimo), com pontos para instalação dos equipamentos em seu interior além de pontos para acesso inferior para Energia e dados através de eletroduto. Internamente os equipamentos utilizaram fixação através de parafuso codificado, com código exclusivo para uso da Telefônica do Brasil. Deve permitir um bom fluxo de ventilação interno e possuir uma porta frontal dotada de porta cadeado eletrônico (tipo Bluetooth) com fecho duplo e dobradiças internas e protegidas. Toda a estrutura deve ser construída de forma a impossibilitar a inserção de alavancas. Deve estar construído de forma a possibilitar a instalação de FCC e baterias em sua base caso seja necessário para a sua instalação, onde, a base ter capacidade de suportar um banco de 4 baterias do tipo 12/100Ah, em bandeja com tratamento anticorrosivo.',
        tipo: ['Alto']
    }, {
        planoId: '10',
        indexA: 1,
        indexQ: 11,
        question: '',
        nomeTecnico: 'Proteção para ODU(s)',
        apicabilidade: 'Rádios com Instalação Externa',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: 'Equipamento de proteção para unidades de rádios com instalação externa, confeccionada em chapa de aço de 1/8” (mínimo), resistente a intemperes causados pela exposição ao tempo. O conjunto de proteção deverá ter o acabamento com pintura eletrostática (Epóxi) ou com galvanização a fogo, com laudo específico para tal. Os parafusos de fixação deverão ser codificados, com código exclusivo para uso da Telefônica do Brasil, e deverão ter proteção contra o acesso direto aos mesmos, ficando completamente embutidos no sistema de fixação da peça. A unidade de rádio não poderá ter o acesso aos cabos bloqueados pelo equipamento de proteção. Corrente ou trava em ODU’s que ficam acopladas direto na antena. Cinta de proteção para a ODU dos rádios PDH (Huawei, Nec, Alcatel, Siae, Ericsson, Petha e outros)',
        tipo: ['Alto']
    }, {
        planoId: '11',
        indexA: 2,
        indexQ: 2,
        question: '',
        nomeTecnico: 'Envelopamento para proteção de cabos',
        apicabilidade: 'Cabos de RF, Fibra Ótica e outros Cabos',
        ambiente: ['Greenfield'],
        especificacao: 'Consiste em proteções confeccionadas em chapa metálica galvanizada, espessura mínima de 2 mm, c/ dobras nas extremidades p/ melhor resistência nas Tampas, sendo o corpo inferior dobrado em perfil “U” enrijecido, nas dimensões padronizadas e ou conforme necessidade de Projeto. A aplicação do envelopamento deverá iniciar desde os Gabinetes/Container, seguindo o esteiramento vertical, finalizando a uma altura de 6 metros; Deverá ser fixada com solda elétrica e recebe acabamento em galvanização a frio e pintura cromatizada. Envelopamento para proteção de cabos de RF, Fibra, cabos de alimentação para ODU’s e RRU’s, com tubo de aço galvanizado com espessura mínima de 2.00 mm e com as emendas soldadas ou coladas com fixadores químicos dificultando ou impossibilitando a abertura e o acesso ao seu interior.',
        tipo: ['Médio', 'Alto']
    }, {
        planoId: '12',
        indexA: 2,
        indexQ: 2,
        question: '',
        nomeTecnico: 'Fita Metálica',
        apicabilidade: 'Cabos de RF, energia e Fibras óticas',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: 'Consiste em Fitas metálicas fabricadas em Aço Inox e revestidas com tratamento isolante do tipo PVC ou Borracha, com as dimensões mínimas de 9,53mm X 0,4mm X 400mm de comprimento. A serem utilizadas na fixação de cabos de RF, cabos de TX, cabos de Alimentação, eletrodutos e fibras Óticas em esteiramentos ou eletrocalhas horizontais e verticais, visando impedir e dificultar a retirada dos materiais fixados de forma a possibilitar um retardamento na velocidade de ação de atos de furto e vandalismo em estruturas, hoje fixadas por meio de braçadeiras do tipo plástica',
        tipo: ['Médio', 'Alto']
    }, {
        planoId: '13',
        indexA: 1,
        indexQ: 0,
        question: '',
        nomeTecnico: 'Protetor para medidor de energia',
        apicabilidade: 'Medidor de energia QDG/QTM',
        ambiente: ['Greenfield'],
        especificacao: 'Consiste em proteções confeccionadas em chapa metálica galvanizada, espessura mínima de 2 mm, c/ dobras nas extremidades p/ melhor resistência nas Tampas, sendo o corpo inferior dobrado em perfil “U” enrijecido, nas dimensões padronizadas e ou conforme necessidade de Projeto. A aplicação do envelopamento deverá iniciar desde os Gabinetes/Container, seguindo o esteiramento vertical, finalizando a uma altura de 6 metros; Deverá ser fixada com solda elétrica e recebe acabamento em galvanização a frio e pintura cromatizada. Envelopamento para proteção de cabos de RF, Fibra, cabos de alimentação para ODU’s e RRU’s, com tubo de aço galvanizado com espessura mínima de 2.00 mm e com as emendas soldadas ou coladas com fixadores químicos dificultando ou impossibilitando a abertura e o acesso ao seu interior.',
        tipo: ['Médio', 'Alto']
    }, {
        planoId: '14',
        indexA: 1,
        indexQ: 5,
        question: '',
        nomeTecnico: 'Gaveta de Proteção',
        apicabilidade: 'Banco de Baterias',
        ambiente: ['Greenfield'],
        especificacao: "Caixa metálica com tampa, tendo seu corpo confeccionado em chapa de aço de 1/8” (mínimo), de forma a permitir a fixação no interior dos gabinetes. A tampa da caixa, deverá ser confeccionada em chapa de aço de 3,75 mm de espessura (mínima), com sistema de travamento inferior e superior e não possuir bordas aparentes, apenas bordas protegidas de forma a evitar a utilização de mecanismos do tipo alavanca para retirada dela. A gaveta de proteção deverá ter o acabamento com pintura eletrostática (Epóxi) ou com galvanização a fogo, com laudo específico para tal. Os parafusos de fixação deverão ser codificados, com código exclusivo para uso da Telefônica do Brasil, e ter proteção contra o acesso direto aos mesmos, ficando completamente embutidos no sistema de fixação da tampa. Caixa metálica com tampa, tendo seu corpo confeccionado em chapa de aço de 1/8” (mínimo), de forma a permitir a fixação no interior dos gabinetes. A tampa da caixa, deverá ser confeccionada em chapa de aço de 3,75 mm de espessura (mínima), com sistema de travamento inferior e superior e não possuir bordas aparentes, apenas bordas protegidas de forma a evitar a utilização de mecanismos do tipo alavanca para retirada dela. A gaveta de proteção deverá ter o acabamento com pintura eletrostática (Epóxi) ou com galvanização a fogo, com laudo específico para tal. Os parafusos de fixação deverão ser codificados, com código exclusivo para uso da Telefônica do Brasil, e ter proteção contra o acesso direto aos mesmos, ficando completamente embutidos no sistema de fixação da tampa. \
        A gaveta deverá possuir em seu conjunto, bornes externos que possibilitem a medição do banco de baterias, por elemento e do conjunto como um todo. \
        Gaveta para baterias aço galvanizado 2.65 mm, porta galvanizada de 5 mm com trava de alta segurança para os seguintes modelos de Gabinetes: \
        •Proteção para Bancos de Baterias no gabinete APM30.\
        •Proteção para Bancos de baterias nos gabinetes 2106 com ou sem BBC.\
        •Proteção com polímero de baterias (Tipo Módulo Mabece).",
        tipo: ['Alto']
    }, {
        planoId: '15',
        indexA: 2,
        indexQ: 4,
        question: '',
        nomeTecnico: 'Caixa Subterrânea',
        apicabilidade: 'Proteção de Alimentação AC',
        ambiente: ['Greenfield'],
        especificacao: "Caixa metálica com tampa, tendo seu corpo confeccionado em chapa de aço de 1/8” (mínimo), de forma a permitir a fixação no interior dos gabinetes. A tampa da caixa, deverá ser confeccionada em chapa de aço de 3,75 mm de espessura (mínima), com sistema de travamento inferior e superior e não possuir bordas aparentes, apenas bordas protegidas de forma a evitar a utilização de mecanismos do tipo alavanca para retirada dela. A gaveta de proteção deverá ter o acabamento com pintura eletrostática (Epóxi) ou com galvanização a fogo, com laudo específico para tal. Os parafusos de fixação deverão ser codificados, com código exclusivo para uso da Telefônica do Brasil, e ter proteção contra o acesso direto aos mesmos, ficando completamente embutidos no sistema de fixação da tampa. Caixa metálica com tampa, tendo seu corpo confeccionado em chapa de aço de 1/8” (mínimo), de forma a permitir a fixação no interior dos gabinetes. A tampa da caixa, deverá ser confeccionada em chapa de aço de 3,75 mm de espessura (mínima), com sistema de travamento inferior e superior e não possuir bordas aparentes, apenas bordas protegidas de forma a evitar a utilização de mecanismos do tipo alavanca para retirada dela. A gaveta de proteção deverá ter o acabamento com pintura eletrostática (Epóxi) ou com galvanização a fogo, com laudo específico para tal. Os parafusos de fixação deverão ser codificados, com código exclusivo para uso da Telefônica do Brasil, e ter proteção contra o acesso direto aos mesmos, ficando completamente embutidos no sistema de fixação da tampa. \
        A gaveta deverá possuir em seu conjunto, bornes externos que possibilitem a medição do banco de baterias, por elemento e do conjunto como um todo. \
        Gaveta para baterias aço galvanizado 2.65 mm, porta galvanizada de 5 mm com trava de alta segurança para os seguintes modelos de Gabinetes: \
        •Proteção para Bancos de Baterias no gabinete APM30.\
        •Proteção para Bancos de baterias nos gabinetes 2106 com ou sem BBC.\
        •Proteção com polímero de baterias (Tipo Módulo Mabece).",
        tipo: ['Médio','Alto']
    }, {
        planoId: '16',
        indexA: 0,
        indexQ: 7,
        question: '',
        nomeTecnico: 'Gaiola de Proteção',
        apicabilidade: 'RRU',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "Estrutura em chapa de aço SAE 1020, ou similar, nas dimensões de 50 x 30 x 2mm (mínimo), soldada conforme especificações técnicas.Estrutura em chapa de aço SAE 1020, ou similar, nas dimensões de 50 x 30 x 2mm (mínimo), soldada conforme especificações técnicas.\
        Porta de acesso c/ dobradiças internas, soldadas numa das laterais e sistema de porta cadeado blindado, onde o cadeado é fixado impedindo a sua remoção e evitando possíveis arrombamentos.\
        Deverá possuir revestimento interno em chapa expandida espessura 3/16” (mínimo) em toda sua extensão.",
        tipo: ['Alto']
    }, {
        planoId: '17',
        indexA: 0,
        indexQ: 7,
        nomeTecnico: 'Gaiola de Proteção',
        apicabilidade: 'RRU’s montadas em mastro no solo.',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "RRU’s montadas em mastro solo devem ser dotadas de Gradil, com dispositivo para acondicionar cadeado eletrônico ou Bluetooth de forma blindada.RRU’s montadas em mastro solo devem ser dotadas de Gradil, com dispositivo para acondicionar cadeado eletrônico ou Bluetooth de forma blindada.\
        Dotada de capacidade de atender até três mastros simultâneos totalizando até 9 RRU’s.\
        Deverá ser construída e chumbada em base de concreto de forma a impedir a utilização de alavanca.",
        tipo: ['Alto']
    }, {
        planoId: '18',
        indexA: 1,
        indexQ: 5,
        question: '',
        nomeTecnico: 'Cofre para Baterias',
        apicabilidade: 'Proteção de Baterias',
        ambiente: ['Greenfield'],
        especificacao: "Deve possuir magazine interno parafusado, fabricado em chapa inox AISI 304, espessura 3mm (mínimo), na qual as bandejas (4 partes) devem possuir regulagem de altura, com colunas de fixação providas de furações p/ tal, também em aço inox, a fim de minimizar ou evitar qualquer risco ou possibilidade de corrosões provenientes do ácido das baterias ali acondicionadas. Cada Bandeja deve ter capacidade de suportar um banco de baterias com capacidade de até 200Ah. Preenchimento entre as paredes interna e externa com massa cimentícia de alta resistência mecânica, com adição de limalha de aço; nas laterais, fundo e teto, bem como na porta de acesso.Deve possuir magazine interno parafusado, fabricado em chapa inox AISI 304, espessura 3mm (mínimo), na qual as bandejas (4 partes) devem possuir regulagem de altura, com colunas de fixação providas de furações p/ tal, também em aço inox, a fim de minimizar ou evitar qualquer risco ou possibilidade de corrosões provenientes do ácido das baterias ali acondicionadas. Sistemas de ventilação e aeração forçada por conjunto de ventoinhas avulsas (coolers) na parte inferior e na parte superior. Deverá ser provido de termostato a fim de acionar ou desligar o sistema de ventilação, municiado de regulagem de temperatura ambiente. A porta de acesso deverá ter as dobradiças laterais embutidas, fixadas na estrutura interna, impossibilitando e dificultando qualquer acesso ou arrombamento. O fechamento e abertura p/ acesso de vistoria e manutenção, deverá ser feito através de sistema duplo: trava (maçaneta) + fechadura ou cadeado Bluetooth e travamento do batente interno, com pinos. Deverá possuir um sinalizador de porta aberta com fiação oculta, sistema “push botton” ou magnético, que não pode ser visualizado e acessado. A estrutura deverá ser montada e chumbada sobre base de concreto de forma a evitar a utilização de Pé de cabra ou alavanca para tombamento.",
        tipo: ['Alto']
    }, {
        planoId: '19',
        indexA: 1,
        indexQ: 9,
        question: '',
        nomeTecnico: 'Estante de Baterias com proteção',
        apicabilidade: 'Container/ Prédio',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "Estante construída em aço com capacidade para até 4 bancos de baterias do tipo 12/200Ah revestida em barras de aço SAE 1020, ou similar, com espessura mínima de 3 mm, laterais, fundo, tampa e frente. Deve receber tratamento anticorrosivo com aplicação de borracha liquida IMPERTECH, ou similar – dielétrica, anticorrosiva e refletiva de calor, e segunda aplicação em pintura eletrostática (Epóxi) na cor pantone padrão dos armários da operadora VIVO. Deverá permitir o acesso as baterias para inspeção visual de polos e bancos, todas as chapas para acesso frontal deverão ser fixadas com parafusos do tipo codificado, e, as demais grades, soldadas a estrutura que por sua vez, precisa impreterivelmente estar chumbada ou fixada no piso e na parede. Cada nível da estante deve ter capacidade de suportar um banco de baterias com capacidade de até 200Ah para 48VDC.",
        tipo: ['Alto']
    }, {
        planoId: '20',
        indexA: 1,
        indexQ: 9,
        question: '',
        nomeTecnico: 'Proteção para estante de Baterias',
        apicabilidade: 'Container/ Prédio',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "A proteção deverá ser executada com barras de aço do tipo SAE 1020 com espessura mínima de 3mm, revestindo a estrutura existente por todos os lados de forma a impedir que qualquer bateria possa ser retirada da estante. A grade para o fundo, topo e laterais pode ser fixada através de soldagem a estrutura existente, já para a frente da estante a mesma deve ser fixada com parafusos codificados. Toda a estrutura da grade deve ser chumbada ou fixada na parede e no piso da edificação e pintada na cor da estante existente. Deve receber tratamento anticorrosivo com aplicação de borracha liquida IMPERTECH, ou similar – dielétrica, anticorrosiva e refletiva de calor, e segunda aplicação em pintura eletrostática (Epóxi) na cor pantone padrão dos armários da operadora VIVO.A proteção deverá ser executada com barras de aço do tipo SAE 1020 com espessura mínima de 3mm, revestindo a estrutura existente por todos os lados de forma a impedir que qualquer bateria possa ser retirada da estante. A grade para o fundo, topo e laterais pode ser fixada através de soldagem a estrutura existente, já para a frente da estante a mesma deve ser fixada com parafusos codificados. Toda a estrutura da grade deve ser chumbada ou fixada na parede e no piso da edificação e pintada na cor da estante existente. Deve receber tratamento anticorrosivo com aplicação de borracha liquida IMPERTECH, ou similar – dielétrica, anticorrosiva e refletiva de calor, e segunda aplicação em pintura eletrostática (Epóxi) na cor pantone padrão dos armários da operadora VIVO. Deverá permitir o acesso as baterias para inspeção visual de polos e bancos, todas as chapas para acesso frontal deverão ser fixadas com parafusos do tipo codificado, e, as demais grades, soldadas a estrutura que por sua vez, precisa impreterivelmente estar chumbada ou fixada no piso e na parede. Cada nível da estante deve ter capacidade de suportar um banco de baterias com capacidade de até 200Ah para 48VDC.",
        tipo: ['Alto']
    }, {
        planoId: '21',
        indexA: 1,
        indexQ: 12,
        question: '',
        nomeTecnico: 'Barra de Proteção para Porta',
        apicabilidade: 'Container/ Prédio',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "Composta de Perfil dobrado em “U”, confeccionada em chapa aço SAE 1020, ou similar. Dimensões de fabricação conforme modelo da trava de acesso, ou projeto específico. Trava porta cadeado embutida, dificultando acesso a possíveis arrombamentos. Acabamento em pintura eletrostática (Epóxi), ou galvanização a fogo dentro das especificações exigidas. Gradil (gaiola) de proteção para container com dimensões que atendam as portas, ou acessos ao seu interior e fixado e soldado de forma a impedir o uso de alavanca e dotado de sistema de abertura do tipo Bluetooth ou cadeado eletrônico. Gradil (gaiola) de proteção para container com dimensões que atendam as portas, ou acessos ao seu interior fixado e soldado de forma a impedir o uso de alavanca e dotado de sistema de abertura",
        tipo: ['Alto']
    }, {
        planoId: '22',
        indexA: 1,
        indexQ: 12,
        question: '',
        nomeTecnico: 'Grade de Proteção para Porta',
        apicabilidade: 'Container/ Prédio de Alvenaria',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "Composta de tubo Quadrado ou retangular do tipo galvanizado com espessura de 2mm² em chapa aço SAE 1020, ou similar. Dimensões de fabricação conforme modelo da porta de acesso, ou projeto específico. Deve possuir dobradiças embutidas e dois portas cadeados embutidos para cadeados Bluetooth ou cadeado eletrônico, dificultando acesso a possíveis arrombamentos. Acabamento em pintura eletrostática (Epóxi), ou galvanização a fogo dentro das especificações exigidas. O Gradil (gaiola) de proteção para a porta deve ser fixado e chumbado sempre de forma a evitar ou impedir o uso de alavanca e dotado de sistema de abertura do tipo Bluetooth ou cadeado eletrônico.",
        tipo: ['Alto']
    }, {
        planoId: '23',
        indexA: 1,
        indexQ: 7,
        question: '',
        nomeTecnico: 'Gradil de Proteção',
        apicabilidade: 'Gabinete APM30',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "Fabricado em estrutura de chapa de aço SAE 1020, ou similar, de dimensões 50x30x2mm (mínimo), soldada conforme especificações. Deverá ser composta em partes individuais, sendo 02 (duas) laterais providas c/ sapatas de fixação para chamamento “in loco”, e engate tipo pivotante p/ acondicionar parte traseira. Porta de acesso frontal c/ dobradiças internas, e sistema de porta cadeado fixado, impedindo a sua remoção e evitando possíveis arrombamentos. Provido de proteção metálica em chapa 3 mm (mínimo), a fim de dificultar acesso e possíveis arrombamentos. Revestida internamente – em toda sua extensão - em chapa expandida, espessura 3/16” (mínimo). Acabamento deve ser executado em galvanização a fogo, com laudo específico para tal.",
        tipo: ['Alto']
    }, {
        planoId: '24',
        indexA: 1,
        indexQ: 7,
        question: '',
        nomeTecnico: 'Gradil de Proteção',
        apicabilidade: 'Gabinetes Ericsson/ Huawei',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "Barra chata de 4'x 1/4 e cantoneira 2' x 1/4 no reforço da porta e no contorno do gabinete;Barra chata de 4'x 1/4 e cantoneira 2' x 1/4 no reforço da porta e no contorno do gabinete; - Chapa #14 no corpo da proteção da porta; - Cantoneira de 2' x 1/4 no batente da porta; - Reforço interno da porta danificada na barra chata de 1/2 x 1/8; - Concreto para enchimento (frontal e traseira) de viga com resistência - FCK 30mpa; - Confecção da proteção porta cadeado eletrônico na chapa espessura 4”; - Pintura da proteção (orçamento com galvanização a fogo e tinta epóxi); - Instalação de 3 rolamentos travados em um corpo tubular (substituição de dobradiças); - Fixação da estrutura na parte frontal com split bolt a 5 cm abaixo da base.",
        tipo: ['Alto']
    }, {
        planoId: '24',
        indexA: 1,
        indexQ: 12,
        question: '',
        nomeTecnico: 'Gradil de Proteção',
        apicabilidade: 'Gabinetes Ericsson/ Huawei',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "Barra chata de 4'x 1/4 e cantoneira 2' x 1/4 no reforço da porta e no contorno do gabinete;Barra chata de 4'x 1/4 e cantoneira 2' x 1/4 no reforço da porta e no contorno do gabinete; - Chapa #14 no corpo da proteção da porta; - Cantoneira de 2' x 1/4 no batente da porta; - Reforço interno da porta danificada na barra chata de 1/2 x 1/8; - Concreto para enchimento (frontal e traseira) de viga com resistência - FCK 30mpa; - Confecção da proteção porta cadeado eletrônico na chapa espessura 4”; - Pintura da proteção (orçamento com galvanização a fogo e tinta epóxi); - Instalação de 3 rolamentos travados em um corpo tubular (substituição de dobradiças); - Fixação da estrutura na parte frontal com split bolt a 5 cm abaixo da base.",
        tipo: ['Alto']
    }, {
        planoId: '25',
        indexA: 1,
        indexQ: 7,
        question: '',
        nomeTecnico: 'Gradil de Proteção',
        apicabilidade: 'Gabinetes Diversos',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "Composto em 02 (duas) laterais, quadro posterior e porta de acesso frontal, soldados em tubo de aço SAE 1020, ou similar, 60x60x2mm (mínimo) e 50x30x2mm (mínimo) respectivamente. O conjunto deverá ser fixado com o uso de parábolas ou soldagem no Skid (quadros laterais), através das sapatas soldadas, e em seguida a parte posterior por encaixe, e a seguir a porta de acesso através dos pinos dobradiça existentes, também soldados. A porta de acesso frontal deverá ter dobradiças internas, e sistema de porta cadeado fixado, impedindo a sua remoção e evitando possíveis arrombamentos. Provido de proteção metálica em chapa 3 mm (mínimo), a fim de dificultar acesso e possíveis arrombamentos.",
        tipo: ['Alto']
    }, {
        planoId: '26',
        indexA: 1,
        indexQ: 7,
        question: '',
        nomeTecnico: 'Gradil de Proteção Especial',
        apicabilidade: 'Gabinetes',
        ambiente: ['Greenfield'],
        especificacao: "O conjunto deverá ser fixado com o uso de parabolts ou soldagem no Skid (quadros laterais), através das sapatas soldadas, e em seguida a parte posterior por encaixe, e a seguir a porta de acesso através dos pinos dobradiça existentes, também soldados.O conjunto deverá ser fixado com o uso de parabolts ou soldagem no Skid (quadros laterais), através das sapatas soldadas, e em seguida a parte posterior por encaixe, e a seguir a porta de acesso através dos pinos dobradiça existentes, também soldados. A porta de acesso frontal deverá ter dobradiças internas, e sistema de porta cadeado fixado, impedindo a sua remoção e evitando possíveis arrombamentos. Provido de proteção metálica em chapa 3 mm (mínimo), a fim de dificultar acesso e possíveis arrombamentos. Acabamento em galvanização a fogo, com laudo específico para tal.",
        tipo: ['Alto']
    }, {
        planoId: '27',
        indexA: 1,
        indexQ: 7,
        question: '',
        nomeTecnico: 'Gabinete Blindado',
        apicabilidade: 'Cofre Blindado com Grautec',
        ambiente: ['Greenfield'],
        especificacao: "Gabinete do tipo Cofre Blindado com Grautec (Cimento com limalha de aço) em todas as paredes da BTS Cofre para inibir corte e abertura forçada, deve conter 8 coolers (ventiladores) para troca de ar dentro da BTS e ser provida de controle de acesso por fechadura eletrônica ou cadeado Bluetooth. Deve possuir dimensões suficientes para acondicionar o gabinete a ser protegido no seu interior conforme padrão adotado na localidade. Esta proteção deve ser chumbada em base de concreto de forma a impedir a utilização de alavanca. Preenchimento entre as paredes interna e externa com massa cimentícia de alta resistência mecânica, com adição de limalha de aço; nas laterais, fundo e teto, bem como na porta de acesso. Sistemas de ventilação e aeração forçada por conjunto de ventoinhas avulsas (coolers) na parte inferior e na parte superior. Deverá ser provido de termostato a fim de acionar ou desligar o sistema de ventilação, municiado de regulagem de temperatura ambiente. A porta de acesso deverá ter as dobradiças laterais embutidas, fixadas na estrutura interna, impossibilitando e dificultando qualquer acesso ou arrombamento. O fechamento e abertura p/ acesso de vistoria e manutenção, deverá ser feito através de sistema duplo: trava (maçaneta) ou fechadura eletrônica do tipo Bluetooth e travamento do batente interno, com pinos. Deverá possuir um sinalizador de porta aberta com fiação oculta, sistema “push botton” ou magnético, que não pode ser visualizado e acessado. A estrutura deverá ser montada e chumbada sobre base de concreto de forma a evitar a utilização de Pé de cabra ou alavanca para tombamento.",
        tipo: ['Alto']
    }, {
        planoId: '28',
        indexA: 1,
        indexQ: 7,
        question: '',
        nomeTecnico: 'Gradil Hardbox Worktek',
        apicabilidade: 'Gabinetes',
        ambiente: ['Greenfield'],
        especificacao: "Chapas SAE 1020 utilizadas na confecção do gradil (HARDBOX) montadas em xadrez, tubos redondos em aço SAE 1020 utilizados nas portas e nas junções, cremalheira e engrenagem em aço SAE 1035 e 1045 (tranca interna)",
        tipo: ['Alto']
    }, {
        planoId: '29',
        indexA: 1,
        indexQ: 1,
        question: '',
        nomeTecnico: 'Proteção de Quadros Externos',
        apicabilidade: 'Cabos de Energia',
        ambiente: ['Greenfield', 'Rooftop'],
        especificacao: "Gradil para proteção ou colocação de fechadura com parafuso especial em relógios das empresas de energia e QDG’s Vivo. Hasplock e cadeado Bluetooth, fechadura eletrônica ou fechadura com parafuso especial para proteção de portas dos TC’s dos sites.",
        tipo: ['Alto']
    }, {
        planoId: '31',
        indexA: 0,
        indexQ: 1,
        question: '',
        nomeTecnico: 'Portões',
        apicabilidade: 'Proteção de Sites em Geral',
        ambiente: ['Greenfield'],
        especificacao: "Fornecimento e instalação de Portão de tubo de aço galvanizado reforçado, todo em chapa de aço com espessura mínima de 3mm, com friso do tipo bico de diamante pintado na cor padrão e nas dimensões de 3 metros de altura por 4 de largura.",
        tipo: ['Alto']
    }, {
        planoId: '32',
        indexA: 2,
        indexQ: 1,
        question: '',
        nomeTecnico: 'Alçapão da Torre',
        apicabilidade: 'Torre ',
        ambiente: ['Greenfield'],
        especificacao: "Fornecimento e instalação de Portão de tubo de aço galvanizado reforçado, todo em chapa de aço com espessura mínima de 3mm, com friso do tipo bico de diamante pintado na cor padrão e nas dimensões de 3 metros de altura por 4 de largura.",
        tipo: ['Médio','Alto']
    }, {
        planoId: '33',
        indexA: 1,
        indexQ: 10,
        question: '',
        nomeTecnico: 'Proteção para Ar Condicionado',
        apicabilidade: 'Ar Condicionado de Parede',
        ambiente: ['Greenfield'],
        especificacao: "Consiste em carenagem metálica, produzida em chapa aço SAE 1020, ou similar, espessura 3 mm (mínimo) envolvendo o equipamento fixado na parede do Container ou edificação. Dimensões conforme modelo e marca do equipamento, ou pré-definido pela Telefônica do Brasil. Quadro suporte em perfil metálico dobrado, soldado conforme especificações vigentes. Deverá ser provida de bandeja metálica inferior c/ tubo p/ acondicionar mangueira de escoamento dos líquidos condensados. Acabamento em pintura eletrostática (epóxi), ou galvanizada a fogo dentro das especificações exigidas e laudo técnico. Instalada no container ou em prédio de alvenaria sempre pelo lado de dentro e fixada nas paredes e dotado de sistema de travas com parafusos do tipo explosão ou codificados a fim de impossibilitar a retirada da máquina.",
        tipo: ['Médio','Alto']
    }, {
        planoId: '35',
        indexA: 1,
        indexQ: 10,
        question: '',
        nomeTecnico: 'Proteção para Unidade Condensadora de Ar Condicionado',
        apicabilidade: 'Ar Condicionado Ar Condicionado de Split e Self',
        ambiente: ['Greenfield'],
        especificacao: "Fabricada em chapa de aço SAE 1020, ou similar, na espessura de 3mm (mínimo), tendo os componentes em perfil dobrado, melhorando sua resistência mecânica na montagem final. Quadro de fixação fabricado em perfil “L” chapa aço SAE 1020, ou similar, soldado. As dimensões variam de acordo c/ modelo do equipamento a ser instalado e protegido (a ser definido pela Telefônica do Brasil). Deverá ser fornecido com acabamento e finalização em Pintura eletrostática (epóxi), ou galvanização a fogo, com proteção anticorrosivo, obedecendo a normas vigentes c/ fornecimento de laudo. Gradil com porta cadeado para proteção das condensadoras dos condicionadores de ar; Para proteção dos split ’s, deverá ser considerada as especificações exigidas ou similares; - Base de barras U soldadas, onde será fixada no container internamente pela lateral e passará a tubulação de cobre e cabos de energia; - Tela expandida onde será fixada as condensadoras em barras chatas (fixadas por cintas); - 2 (Duas) portinholas de manutenção em chapa ¼ com cadeado padrão, com abertura menor que a máquina (a porta será soldada após a máquina entrar em operação); - Cantoneiras soldadas internamente nas extremidades para fixação da tela expandida;",
        tipo: ['Médio','Alto']
    }, {
        planoId: '36',
        indexA: 1,
        indexQ: 16,
        question: '',
        nomeTecnico: 'Gradil de Proteção',
        apicabilidade: 'GMG',
        ambiente: ['Greenfield'],
        especificacao: "Composto em 02 (duas) laterais, quadro posterior e porta de acesso frontal, soldados em tubo de aço SAE 1020, ou similar, 60x60x2mm (mínimo) e 50x30x2mm (mínimo) respectivamente. O conjunto deverá ser fixado com o uso de parabolts ou soldagem no Skid (quadros laterais), através das sapatas soldadas, e em seguida a parte posterior por encaixe, e a seguir a porta de acesso através dos pinos dobradiça existentes, também soldados. As portas de acesso deveram ter dobradiças internas, e sistema de porta cadeado fixado, impedindo a sua remoção e evitando possíveis arrombamentos. Provido de proteção metálica em chapa 3 mm (mínimo), a fim de dificultar acesso e possíveis arrombamentos. Para a utilização de gradis de proteção com e sem tela expandida deve se considerar as dimensões de cada GMG conforme tabela abaixo:",
        tipo: ['Alto']
    }, {
        planoId: '36',
        indexA: 1,
        indexQ: 19,
        question: '',
        nomeTecnico: 'Gradil de Proteção',
        apicabilidade: 'GMG',
        ambiente: ['Greenfield'],
        especificacao: "Composto em 02 (duas) laterais, quadro posterior e porta de acesso frontal, soldados em tubo de aço SAE 1020, ou similar, 60x60x2mm (mínimo) e 50x30x2mm (mínimo) respectivamente. O conjunto deverá ser fixado com o uso de parabolts ou soldagem no Skid (quadros laterais), através das sapatas soldadas, e em seguida a parte posterior por encaixe, e a seguir a porta de acesso através dos pinos dobradiça existentes, também soldados. As portas de acesso deveram ter dobradiças internas, e sistema de porta cadeado fixado, impedindo a sua remoção e evitando possíveis arrombamentos. Provido de proteção metálica em chapa 3 mm (mínimo), a fim de dificultar acesso e possíveis arrombamentos. Para a utilização de gradis de proteção com e sem tela expandida deve se considerar as dimensões de cada GMG conforme tabela abaixo:",
        tipo: ['Alto']
    }, {
        planoId: '36',
        indexA: 1,
        indexQ: 20,
        question: '',
        nomeTecnico: 'Gradil de Proteção',
        apicabilidade: 'GMG',
        ambiente: ['Greenfield'],
        especificacao: "Composto em 02 (duas) laterais, quadro posterior e porta de acesso frontal, soldados em tubo de aço SAE 1020, ou similar, 60x60x2mm (mínimo) e 50x30x2mm (mínimo) respectivamente. O conjunto deverá ser fixado com o uso de parabolts ou soldagem no Skid (quadros laterais), através das sapatas soldadas, e em seguida a parte posterior por encaixe, e a seguir a porta de acesso através dos pinos dobradiça existentes, também soldados. As portas de acesso deveram ter dobradiças internas, e sistema de porta cadeado fixado, impedindo a sua remoção e evitando possíveis arrombamentos. Provido de proteção metálica em chapa 3 mm (mínimo), a fim de dificultar acesso e possíveis arrombamentos. Para a utilização de gradis de proteção com e sem tela expandida deve se considerar as dimensões de cada GMG conforme tabela abaixo:",
        tipo: ['Alto']
    }, {
        planoId: '101',
        indexA: 1,
        indexQ: 27,
        question: '',
        nomeTecnico: 'Executar Reparo',
        apicabilidade: 'Executar Reparo',
        ambiente: ['Greenfield'],
        especificacao: "Executar Reparo",
        tipo: ['Alto']
    }, {
        planoId: '102',
        indexA: 1,
        indexQ: 30,
        question: '',
        nomeTecnico: 'Executar Instalação',
        apicabilidade: 'Executar Instalação',
        ambiente: ['Greenfield'],
        especificacao: "Executar Instalação",
        tipo: ['Alto']
    }]
}]

export default planoAcao;