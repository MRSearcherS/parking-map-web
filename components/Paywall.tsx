import { Lock, ShieldCheck } from 'lucide-react';

type Props = {
  isPro: boolean;
  nearbyCount: number;
};

export function Paywall({ isPro, nearbyCount }: Props) {
  if (isPro) {
    return (
      <div className="paywall-card pro">
        <h2><ShieldCheck size={18} /> PRO активен</h2>
        <p>Точные адреса и маркеры парковок доступны. Следующим этапом сюда добавим маршруты, избранное и фильтры.</p>
      </div>
    );
  }

  return (
    <div className="paywall-card">
      <h2><Lock size={18} /> Доступ закрыт</h2>
      <div className="paywall-count">{nearbyCount}</div>
      <p>столько бесплатных парковок найдено рядом. Точные места, адреса и маршруты доступны после открытия PRO.</p>
      <div style={{ height: 12 }} />
      <button className="primary-button" type="button" onClick={() => alert('В MVP оплата пока не подключена. PRO включается вручную в Supabase.')}>Открыть PRO</button>
    </div>
  );
}
