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
  Calendar as CalendarIcon
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { getDeviceFromUserAgent } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfWeek, eachDayOfInterval, format, subMonths, getYear, getDay, startOfMonth, endOfMonth, getMonth, setMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const [timeRange, setTimeRange] = useState('week');
  const [allClicks, setAllClicks] = useState<any[]>([]);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());

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

      setAllClicks(userClicks);
      setTotalClicks(userClicks.length);
      
      if (userClicks.length > 0) {
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
        setTopCountries([]);
        setTopCities([]);
        setTopDevices([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);
  
  useEffect(() => {
    if (allClicks.length === 0 && !loading) {
       setChartData([]);
       return;
    }

    let interval;
    const today = new Date();

    if (timeRange === 'week') {
        interval = { start: startOfWeek(today, { weekStartsOn: 1 }), end: today };
    } else { // month
        interval = { start: startOfMonth(selectedMonthDate), end: endOfMonth(selectedMonthDate) };
    }
    
    const daysInInterval = eachDayOfInterval(interval);

    const clicksByDay = allClicks.reduce((acc, click) => {
        const date = format(click.timestamp, 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const dataForChart = daysInInterval.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return {
            date: dateStr,
            count: clicksByDay[dateStr] || 0,
        };
    });

    setChartData(dataForChart);

}, [allClicks, timeRange, selectedMonthDate, loading]);


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
  
  const formatXAxisTick = (value: string) => {
    if (timeRange === 'week') {
      const dayIndex = getDay(new Date(value));
      // Sunday is 0, so we map it to the end of the week.
      const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
      return dayNames[dayIndex];
    }
    return format(new Date(value), 'd');
  };
  
  const handleMonthChange = (monthValue: string) => {
    const newDate = setMonth(selectedMonthDate, parseInt(monthValue));
    if (newDate > new Date()) {
      setSelectedMonthDate(new Date());
    } else {
      setSelectedMonthDate(newDate);
    }
  };

  const handleYearChange = (yearValue: string) => {
    const newDate = setYear(selectedMonthDate, parseInt(yearValue));
     if (newDate > new Date()) {
      setSelectedMonthDate(new Date());
    } else {
      setSelectedMonthDate(newDate);
    }
  };

  const availableYears = [getYear(new Date()), getYear(subMonths(new Date(), 12))];
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
      value: i.toString(),
      label: format(new Date(2000, i), 'MMMM', { locale: es }),
  }));


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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className='flex-1'>
                <CardTitle>Rendimiento de Clics</CardTitle>
                <CardDescription>Evolución de los clics en el período seleccionado.</CardDescription>
              </div>
               <div className="flex items-center gap-2">
                  <Tabs value={timeRange} onValueChange={setTimeRange} className="w-full sm:w-auto">
                      <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="week">Esta semana</TabsTrigger>
                      <TabsTrigger value="month">Por mes</TabsTrigger>
                      </TabsList>
                  </Tabs>
              </div>
          </div>
          {timeRange === 'month' && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Select
                    value={getMonth(selectedMonthDate).toString()}
                    onValueChange={handleMonthChange}
                  >
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Seleccionar mes" />
                      </SelectTrigger>
                      <SelectContent>
                          {monthOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select
                     value={getYear(selectedMonthDate).toString()}
                     onValueChange={handleYearChange}
                  >
                      <SelectTrigger className="w-full sm:w-[120px]">
                          <SelectValue placeholder="Seleccionar año" />
                      </SelectTrigger>
                      <SelectContent>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                                {year}
                            </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={chartData} margin={{ left: -20, right: 12, bottom: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatXAxisTick}
                  label={{ value: timeRange === 'month' ? format(selectedMonthDate, 'MMMM', {locale: es}) : 'Días de la semana', position: 'insideBottom', offset: -15, fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                    indicator="dot" 
                    labelFormatter={(label, payload) => payload?.[0] ? format(new Date(payload[0].payload.date), 'eeee, d \'de\' MMMM', {locale: es}) : ''}
                   />}
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
