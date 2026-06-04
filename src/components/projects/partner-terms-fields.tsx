import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AGREEMENT_TYPE_LABELS } from "@/lib/constants"
import type { FieldValues, UseFormReturn } from "react-hook-form"

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

export function PartnerTermsFields({ form }: Props) {
  const { control } = form
  return (
    <div className="space-y-3">
      <FormField control={control} name="role" render={({ field }) => (
        <FormItem><FormLabel>תפקיד בפרויקט</FormLabel>
          <FormControl><Input placeholder="פיתוח, עיצוב, מכירות..." {...field} /></FormControl>
        </FormItem>
      )} />
      <FormField control={control} name="agreementType" render={({ field }) => (
        <FormItem><FormLabel>סוג הסכם</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              {Object.entries(AGREEMENT_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )} />
      <div className="grid grid-cols-3 gap-3">
        <FormField control={control} name="contractPercentage" render={({ field }) => (
          <FormItem>
            <FormLabel>% מהחוזה</FormLabel>
            <FormControl><Input type="number" min="0" max="100" placeholder="0" {...field} /></FormControl>
          </FormItem>
        )} />
        <FormField control={control} name="profitPercentage" render={({ field }) => (
          <FormItem>
            <FormLabel>% מהרווח</FormLabel>
            <FormControl><Input type="number" min="0" max="100" placeholder="0" {...field} /></FormControl>
          </FormItem>
        )} />
        <FormField control={control} name="fixedAmount" render={({ field }) => (
          <FormItem>
            <FormLabel>סכום קבוע</FormLabel>
            <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
          </FormItem>
        )} />
      </div>
      <FormField control={control} name="agreementLink" render={({ field }) => (
        <FormItem><FormLabel>קישור להסכם</FormLabel>
          <FormControl><Input placeholder="https://..." {...field} /></FormControl>
        </FormItem>
      )} />
      <FormField control={control} name="notes" render={({ field }) => (
        <FormItem><FormLabel>הערות</FormLabel>
          <FormControl><Textarea rows={2} {...field} /></FormControl>
        </FormItem>
      )} />
    </div>
  )
}
