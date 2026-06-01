import { notFound } from 'next/navigation';
import { getTransactionByHash } from '@/lib/data';
import TransactionTabs from './TransactionTabs';
import DevNote, { DevNoteSection } from '@/components/DevNote';

export const revalidate = 60;

interface Props {
  params: Promise<{ hash: string }>;
}

export default async function TransactionDetailPage({ params }: Props) {
  const { hash } = await params;
  const tx = await getTransactionByHash(hash);

  if (!tx) {
    notFound();
  }

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-0 px-4 py-8 sm:px-6">
      <DevNote title="Transaction Detail 기획 의도">
        <DevNoteSection heading="페이지 구조">
          <p>Hero: 이벤트 평문 H1 + H2(컨텍스트 문장) + Tx/Block 메타.</p>
          <p>Info Table: Depositor·Provider·Vault → (구분선) → Keepers·Challengers → (구분선) → dApp.</p>
          <p>Footer Tabs: Log(디코딩된 이벤트) / Raw Data(Overview 양식).</p>
          <p>상단 타입 스위처(dev/demo): 6가지 이벤트 케이스 전환.</p>
        </DevNoteSection>
        <DevNoteSection heading="H1 이벤트 분기">
          <p>PeginActivated → "Vault activated"</p>
          <p>BORROW → "Loan taken out"</p>
          <p>REPAY → "Loan repaid"</p>
          <p>ADD_COLLATERAL → "Collateral added"</p>
          <p>REMOVE_COLLATERAL → "Collateral withdrawn"</p>
          <p>LIQUIDATION → "Vault liquidated"</p>
        </DevNoteSection>
        <DevNoteSection heading="H2 이벤트별 컨텍스트 양식">
          <p>PeginActivated: {'{amount}'} sBTC (${'{usd}'}) is now available as {'{dapp_name}'} collateral</p>
          <p>BORROW: {'{loan_amount}'} borrowed against {'{btc_amount}'} sBTC collateral</p>
          <p>REPAY: {'{loan_amount}'} repaid, freeing {'{btc_amount}'} sBTC collateral</p>
          <p>ADD_COLLATERAL: {'{collateral_amount}'} sBTC added to {'{dapp_name}'} position</p>
          <p>REMOVE_COLLATERAL: {'{collateral_amount}'} sBTC removed from {'{dapp_name}'} position</p>
          <p>LIQUIDATION: {'{btc_amount}'} sBTC collateral seized to cover {'{loan_amount}'} debt</p>
        </DevNoteSection>
        <DevNoteSection heading="Success / Fail 케이스">
          <p>PeginActivated → SUCCESS (green ✓)</p>
          <p>BORROW → SUCCESS (green ✓)</p>
          <p>REPAY → FAILED (red ✗ · 잔액 부족 revert)</p>
          <p>ADD_COLLATERAL → SUCCESS (green ✓)</p>
          <p>REMOVE_COLLATERAL → FAILED (red ✗ · LTV 초과 revert)</p>
          <p>LIQUIDATION → SUCCESS (red ✓ · 청산 완료)</p>
        </DevNoteSection>
        <DevNoteSection heading="정보 위계 원칙">
          <p>hex full값 본문 금지 → 6자...4자 truncation + copy.</p>
          <p>commission·loan 정보는 Summary에서 제거 (Log 탭에서 확인).</p>
          <p>Liquidator는 LIQUIDATION 케이스에서만 노출.</p>
          <p>Hashlock은 Summary에서 제거 (Log 탭 PeginActivated params에서 확인).</p>
        </DevNoteSection>
      </DevNote>

      <TransactionTabs tx={tx} />
    </div>
  );
}
