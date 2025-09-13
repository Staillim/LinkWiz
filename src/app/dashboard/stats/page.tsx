'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Link as LinkType, Click } from '@/lib/definitions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  BarChartBig,
  Link as LinkIcon,
  Activity,
  Globe,
  MapPin,
  Smartphone,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { getDeviceFromUserAgent } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type TopListItem = {
  name: string;
  count: number;
};

export default function StatsPage() {
  const [user, authLoading] = useAuthState(auth);
  const [totalLinks, setTotalLinks] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topCountries, setTopCountries] = useState<TopListItem[]>([]);
  const [topCities, setTopCities] = useState<TopListItem[]>([]);
  const [topDevices, setTopDevices] = useState<TopListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const linksQuery = query(
        collection(db, 'links'),
        where('userId', '==', user.uid)
      );
      const linksSnapshot = await getDocs(linksQuery);
      const userLinks: LinkType[] = linksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LinkType[];

      setTotalLinks(userLinks.length);

      if (userLinks.length === 0) {
        setTotalClicks(0);
        setLoading(false);
        return;
      }

      const linkIds = userLinks.map((link) => link.id);

      const clicksQuery = query(
        collection(db, 'clicks'),
        where('linkId', 'in', linkIds)
      );
      const clicksSnapshot = await getDocs(clicksQuery);
      const userClicks = clicksSnapshot.docs.map((doc) => {
        const data = doc.data() as Click;
        return {
          ...data,
          timestamp: (data.timestamp as Timestamp).toDate(),
        };
      });

      setTotalClicks(userClicks.length);
      
      // Process stats only if there are clicks
      if (userClicks.length > 0) {
        const clicksByDay = userClicks.reduce((acc, click) => {
          const date = click.timestamp.toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { date, count: 0 };
          }
          acc[date].count++;
          return acc;
        }, {} as Record<string, { date: string; count: number }>);
        
        const sortedChartData = Object.values(clicksByDay).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setChartData(sortedChartData);
        
        const processTopList = (key: 'country' | 'city' | 'userAgent') => {
          const counts = userClicks.reduce((acc, click) => {
            let value: string | null = null;
            if (key === 'userAgent') {
               value = click.userAgent ? getDeviceFromUserAgent(click.userAgent) : 'Unknown';
            } else {
               value = click[key] || null;
            }

            if (value) {
                acc[value] = (acc[value] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);

          return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        };

        setTopCountries(processTopList('country'));
        setTopCities(processTopList('city'));
        setTopDevices(processTopList('userAgent'));

      } else {
        setChartData([]);
        setTopCountries([]);
        setTopCities([]);
        setTopDevices([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);

  const chartConfig = {
    clicks: {
      label: 'Clicks',
      color: 'hsl(var(--primary))',
    },
  };

  const TopList = ({ title, data, icon }: { title: string, data: TopListItem[], icon: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
            {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="space-y-3">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-5 w-1/2" />
            </div>
        ) : data.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {data.map((item) => (
              <li key={item.name} className="flex justify-between items-center">
                <span>{item.name}</span>
                <Badge variant="secondary">{item.count.toLocaleString()}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No data available.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
        <BarChartBig className="h-7 w-7" />
        Estadísticas Generales
      </h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Enlaces</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalLinks}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clics</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalClicks}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rendimiento de Clics</CardTitle>
          <CardDescription>Evolución de los clics en los últimos días.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="count"
                  type="natural"
                  fill="var(--color-clicks)"
                  fillOpacity={0.4}
                  stroke="var(--color-clicks)"
                  name="Clics"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              Aún no hay suficientes datos para mostrar el gráfico.
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-3">
          <TopList title="Top Países" data={topCountries} icon={<Globe className="h-5 w-5" />} />
          <TopList title="Top Ciudades" data={topCities} icon={<MapPin className="h-5 w-5" />} />
          <TopList title="Top Dispositivos" data={topDevices} icon={<Smartphone className="h-5 w-5" />} />
      </div>

    </div>
  );
}
