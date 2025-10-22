import { useState, useEffect } from 'react'
import { useEmailPreferences } from '@/hooks/useEmailPreferences'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Bell } from 'lucide-react'

export function EmailPreferences() {
  const { preferences, isLoading, savePreferences, isSaving } = useEmailPreferences()
  const [enabled, setEnabled] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'instant'>('daily')

  useEffect(() => {
    if (preferences) {
      setEnabled(preferences.email_alerts_enabled)
      setFrequency(preferences.alert_frequency)
    }
  }, [preferences])

  const handleSave = () => {
    savePreferences({
      email_alerts_enabled: enabled,
      alert_frequency: frequency,
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Alerts
        </CardTitle>
        <CardDescription>
          Get notified when new jobs matching your preferences are posted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-alerts">Enable Email Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Receive job notifications via email
            </p>
          </div>
          <Switch
            id="email-alerts"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <div className="space-y-3">
            <Label>Alert Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(val) => setFrequency(val as typeof frequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant (as jobs are posted)</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how often you want to receive job alerts
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  )
}
