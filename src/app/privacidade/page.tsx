import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Campo do Bosque",
  description:
    "Saiba como o Campo do Bosque coleta, usa e protege seus dados pessoais.",
};

export default function PoliticaPrivacidadePage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px 80px",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#212121",
        lineHeight: 1.7,
      }}
    >
      {/* Cabeçalho */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cliente-mobile/logo.svg"
            alt="Campo do Bosque"
            style={{ width: 200, height: "auto", display: "block" }}
          />
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#1e5a14",
            margin: "0 0 8px",
            lineHeight: 1.3,
          }}
        >
          Política de Privacidade
        </h1>
        <p style={{ fontSize: 14, color: "#616161", margin: 0 }}>
          Última atualização: junho de 2025
        </p>
      </div>

      <Section title="1. Quem somos">
        <p>
          O <strong>Campo do Bosque</strong> é uma plataforma de gestão de
          planos de assistência funeral que conecta titulares e dependentes a
          redes de serviços funerários parceiras. Nosso aplicativo é o canal
          digital de relacionamento dos clientes com os planos contratados junto
          às empresas operadoras associadas à plataforma.
        </p>
        <p>
          As informações de contato do responsável pelo tratamento de dados
          podem ser obtidas diretamente na central de atendimento do seu plano,
          disponível na seção <strong>Atendimento</strong> do aplicativo.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <p>Coletamos as seguintes categorias de dados pessoais:</p>
        <ul>
          <li>
            <strong>Dados de identificação:</strong> nome completo, CPF, data de
            nascimento, número de carteirinha.
          </li>
          <li>
            <strong>Dados de contato:</strong> e-mail e telefone celular.
          </li>
          <li>
            <strong>Dados de endereço:</strong> logradouro, número, complemento,
            bairro, cidade, estado e CEP.
          </li>
          <li>
            <strong>Dados contratuais:</strong> plano contratado, dependentes
            incluídos, datas de vigência, carência e coberturas.
          </li>
          <li>
            <strong>Assinatura digital:</strong> imagem da assinatura eletrônica
            do titular e corresponsável, registrada no momento da adesão ao
            contrato.
          </li>
          <li>
            <strong>Foto de perfil:</strong> imagem enviada voluntariamente pelo
            titular para identificação visual no aplicativo.
          </li>
          <li>
            <strong>Dados de pagamento:</strong> método de pagamento escolhido
            (PIX, boleto ou cartão de crédito) e, no caso de cartão, os últimos
            quatro dígitos e a bandeira, sem armazenamento do número completo.
          </li>
          <li>
            <strong>Dados de acesso:</strong> logs de autenticação, endereço IP
            de sessão e histórico de notificações enviadas.
          </li>
        </ul>
        <p>
          Não coletamos dados de localização em tempo real nem dados de saúde.
        </p>
      </Section>

      <Section title="3. Para que usamos seus dados">
        <p>Seus dados são utilizados exclusivamente para:</p>
        <ul>
          <li>
            Autenticar seu acesso ao aplicativo e manter sua sessão segura.
          </li>
          <li>
            Exibir as informações do seu plano, carteirinha virtual e dados de
            dependentes.
          </li>
          <li>
            Processar cobranças, registrar pagamentos e gerenciar o método de
            pagamento vinculado ao seu plano.
          </li>
          <li>
            Formalizar e arquivar o contrato de adesão por meio de assinatura
            digital.
          </li>
          <li>
            Enviar notificações sobre o status do seu plano, faturas em aberto e
            comunicados importantes do operador.
          </li>
          <li>
            Atender solicitações de suporte e atendimento encaminhadas pela
            central.
          </li>
          <li>
            Cumprir obrigações legais, regulatórias e contratuais aplicáveis.
          </li>
        </ul>
        <p>
          Não utilizamos seus dados para publicidade de terceiros, venda de
          informações pessoais ou perfilamento automatizado para fins
          comerciais.
        </p>
      </Section>

      <Section title="4. Compartilhamento de dados">
        <p>
          Seus dados podem ser compartilhados com as seguintes categorias de
          parceiros, exclusivamente para viabilizar os serviços contratados:
        </p>
        <ul>
          <li>
            <strong>Gateway de pagamento (Asaas):</strong> para processar
            cobranças, emitir boletos e gerenciar recorrências de cartão.
            Consulte a política de privacidade da Asaas em{" "}
            <a
              href="https://www.asaas.com/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3a9b28" }}
            >
              asaas.com/politica-de-privacidade
            </a>
            .
          </li>
          <li>
            <strong>Provedores de notificação:</strong> para envio de mensagens
            via WhatsApp e SMS, utilizados para comunicação operacional do
            plano.
          </li>
          <li>
            <strong>Operadoras associadas:</strong> a empresa que administra o
            seu plano recebe os dados necessários para prestação dos serviços
            funerários contratados.
          </li>
          <li>
            <strong>Autoridades competentes:</strong> quando exigido por
            determinação legal, judicial ou regulatória.
          </li>
        </ul>
        <p>
          Não vendemos, alugamos nem cedemos seus dados pessoais a terceiros
          para fins comerciais próprios.
        </p>
      </Section>

      <Section title="5. Retenção de dados">
        <p>
          Mantemos seus dados pessoais pelo período necessário para a prestação
          dos serviços e cumprimento das obrigações contratuais. Após o
          encerramento do vínculo contratual, os dados poderão ser retidos pelo
          prazo de até <strong>5 (cinco) anos</strong>, conforme exigências do
          Código Civil Brasileiro e legislação tributária aplicável.
        </p>
        <p>
          Dados de assinatura digital e documentos contratuais podem ser retidos
          por prazo superior quando houver exigência legal específica.
        </p>
      </Section>

      <Section title="6. Segurança das informações">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados
          contra acesso não autorizado, perda, alteração ou divulgação indevida,
          incluindo:
        </p>
        <ul>
          <li>Transmissão de dados criptografada via HTTPS/TLS.</li>
          <li>
            Autenticação por token de sessão com prazo de expiração definido.
          </li>
          <li>
            Controle de acesso por tenant, garantindo isolamento entre dados de
            diferentes operadoras.
          </li>
          <li>
            Dados de cartão processados pelo gateway de pagamento certificado
            PCI-DSS, sem armazenamento do número completo em nossos servidores.
          </li>
          <li>Senhas armazenadas com hash seguro, nunca em texto puro.</li>
        </ul>
      </Section>

      <Section title="7. Seus direitos (LGPD)">
        <p>
          Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018),
          você tem direito a:
        </p>
        <ul>
          <li>Confirmar a existência de tratamento dos seus dados.</li>
          <li>Acessar os dados que mantemos sobre você.</li>
          <li>
            Corrigir dados incompletos, inexatos ou desatualizados — mediante
            contato com a central de atendimento.
          </li>
          <li>
            Solicitar a portabilidade dos seus dados a outro fornecedor de
            serviço.
          </li>
          <li>
            Solicitar a exclusão dos seus dados pessoais, observadas as exceções
            legais e contratuais.
          </li>
          <li>
            Revogar o consentimento dado, quando o tratamento for baseado em
            consentimento.
          </li>
          <li>
            Obter informações sobre o compartilhamento dos seus dados com
            terceiros.
          </li>
        </ul>
        <p>
          Para exercer seus direitos, entre em contato pela central de
          atendimento disponível no aplicativo, na seção{" "}
          <strong>Atendimento</strong>.
        </p>
      </Section>

      <Section title="8. Exclusão de conta">
        <p>
          Você pode solicitar a exclusão da sua conta e dos seus dados pessoais
          diretamente pelo aplicativo, na seção <strong>Ajustes</strong>, ou por
          meio da central de atendimento.
        </p>
        <p>
          A exclusão implica o encerramento do acesso ao aplicativo. Dados que
          precisam ser retidos por obrigação legal ou contratual serão mantidos
          pelo prazo mínimo exigido e, em seguida, eliminados ou anonimizados.
        </p>
      </Section>

      <Section title="9. Câmera e galeria de fotos">
        <p>
          O aplicativo solicita acesso à câmera e à galeria de fotos
          exclusivamente para que você possa atualizar sua foto de perfil. Essa
          permissão não é usada para nenhum outro fim. As imagens enviadas são
          armazenadas de forma segura nos nossos servidores e podem ser
          removidas a qualquer momento nas configurações do perfil.
        </p>
      </Section>

      <Section title="10. Alterações nesta política">
        <p>
          Esta política pode ser atualizada periodicamente para refletir
          mudanças nos serviços ou na legislação. Sempre que houver alterações
          relevantes, notificaremos você pelo aplicativo. A data da última
          atualização está indicada no topo desta página.
        </p>
        <p>
          O uso continuado do aplicativo após a publicação de alterações implica
          a aceitação dos novos termos.
        </p>
      </Section>

      <div
        style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: "1px solid #e0e0e0",
          fontSize: 13,
          color: "#9e9e9e",
          textAlign: "center",
        }}
      >
        Campo do Bosque — Plataforma de Assistência Funeral &copy;{" "}
        {new Date().getFullYear()}
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "#1e5a14",
          marginBottom: 12,
          paddingBottom: 6,
          borderBottom: "2px solid #e8f5e3",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, color: "#424242" }}>{children}</div>
    </section>
  );
}
