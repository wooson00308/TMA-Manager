import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, Play, RotateCcw, Target } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string;
  logs: string[];
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  averageDuration: number;
}

interface TestResponse {
  success: boolean;
  results: TestResult[];
  summary: TestSummary;
  error?: string;
}

export function BattleTestPage() {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);

  // Get available scenarios
  const { data: scenariosData } = useQuery({
    queryKey: ['/api/battle/test/scenarios'],
    enabled: true
  });

  // Run all tests mutation
  const runAllTestsMutation = useMutation({
    mutationFn: async (): Promise<TestResponse> => {
      const response = await fetch('/api/battle/test/run', { method: 'POST' });
      return response.json();
    },
    onSuccess: (data: TestResponse) => {
      if (data.success) {
        setTestResults(data.results);
        setTestSummary(data.summary);
      }
    }
  });

  // Run single test mutation
  const runSingleTestMutation = useMutation({
    mutationFn: async (scenarioName: string): Promise<any> => {
      const response = await fetch('/api/battle/test/single', { 
        method: 'POST',
        body: JSON.stringify({ scenarioName }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.result) {
        setTestResults([data.result]);
        setTestSummary({
          total: 1,
          passed: data.result.success ? 1 : 0,
          failed: data.result.success ? 0 : 1,
          averageDuration: data.result.duration
        });
      }
    }
  });

  const handleRunAllTests = () => {
    setTestResults([]);
    setTestSummary(null);
    runAllTestsMutation.mutate();
  };

  const handleRunSingleTest = () => {
    if (!selectedScenario) return;
    setTestResults([]);
    setTestSummary(null);
    runSingleTestMutation.mutate(selectedScenario);
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}초`;
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "성공" : "실패"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">전투 시스템 테스트 러너</h1>
          <p className="text-muted-foreground">
            전투 시뮬레이션의 모든 구성 요소를 자동으로 검증합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRunAllTests}
            disabled={runAllTestsMutation.isPending}
            className="flex items-center gap-2"
          >
            {runAllTestsMutation.isPending ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            전체 테스트 실행
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              단일 시나리오 테스트
            </CardTitle>
            <CardDescription>
              특정 시나리오만 선택해서 테스트할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">시나리오 선택</label>
              <select 
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">시나리오를 선택하세요</option>
                {(scenariosData as any)?.scenarios?.map((scenario: string) => (
                  <option key={scenario} value={scenario}>
                    {scenario}
                  </option>
                ))}
              </select>
            </div>
            <Button 
              onClick={handleRunSingleTest}
              disabled={!selectedScenario || runSingleTestMutation.isPending}
              className="w-full"
            >
              {runSingleTestMutation.isPending ? (
                <RotateCcw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              선택한 테스트 실행
            </Button>
          </CardContent>
        </Card>

        {/* Test Summary */}
        <Card>
          <CardHeader>
            <CardTitle>테스트 결과 요약</CardTitle>
          </CardHeader>
          <CardContent>
            {testSummary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {testSummary.passed}
                    </div>
                    <div className="text-sm text-muted-foreground">성공</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {testSummary.failed}
                    </div>
                    <div className="text-sm text-muted-foreground">실패</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {formatDuration(testSummary.averageDuration)}
                  </div>
                  <div className="text-sm text-muted-foreground">평균 실행 시간</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline">
                    성공률: {((testSummary.passed / testSummary.total) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                테스트를 실행하면 결과가 여기에 표시됩니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              실행 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            {runAllTestsMutation.isPending || runSingleTestMutation.isPending ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  <span>테스트 실행 중...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  전투 시뮬레이션 검증 중입니다. 완료까지 1-2분 소요됩니다.
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                대기 중
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>테스트 결과 상세</CardTitle>
            <CardDescription>
              각 테스트의 실행 결과와 로그를 확인할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="results">
              <TabsList>
                <TabsTrigger value="results">결과 목록</TabsTrigger>
                <TabsTrigger value="logs">상세 로그</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        <h3 className="font-semibold">{result.testName}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(result.success)}
                        <Badge variant="outline">
                          {formatDuration(result.duration)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.details}
                    </p>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="logs">
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  {testResults.map((result, resultIndex) => (
                    <div key={resultIndex} className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 font-semibold border-b pb-2">
                        {getStatusIcon(result.success)}
                        {result.testName}
                      </div>
                      {result.logs.map((log, logIndex) => (
                        <div key={logIndex} className="text-sm font-mono text-muted-foreground pl-6">
                          {log}
                        </div>
                      ))}
                      {resultIndex < testResults.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {(runAllTestsMutation.error || runSingleTestMutation.error) && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">테스트 실행 오류</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {runAllTestsMutation.error?.message || runSingleTestMutation.error?.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}