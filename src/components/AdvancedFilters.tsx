import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'

export interface AdvancedFilterOptions {
  salaryMin?: number
  salaryMax?: number
  categories?: string[]
  remoteTypes?: string[]
  companySizes?: string[]
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterOptions
  onChange: (filters: AdvancedFilterOptions) => void
  onClear: () => void
  isMobile?: boolean
}

const CATEGORIES = [
  { value: 'Engineering', label: '💻 Engineering', emoji: '💻' },
  { value: 'Design', label: '🎨 Design', emoji: '🎨' },
  { value: 'Marketing', label: '📢 Marketing', emoji: '📢' },
  { value: 'Sales', label: '💼 Sales', emoji: '💼' },
  { value: 'Customer Support', label: '🎧 Customer Support', emoji: '🎧' },
  { value: 'Product', label: '🚀 Product', emoji: '🚀' },
  { value: 'Data', label: '📊 Data', emoji: '📊' },
  { value: 'Other', label: '📋 Other', emoji: '📋' },
]

const REMOTE_TYPES = [
  { value: 'fully-remote', label: '🌍 Fully Remote', emoji: '🌍' },
  { value: 'hybrid', label: '🏢 Hybrid', emoji: '🏢' },
  { value: 'on-site', label: '🏛️ On-site', emoji: '🏛️' },
  { value: 'timezone-specific', label: '🕐 Timezone Specific', emoji: '🕐' },
]

const COMPANY_SIZES = [
  { value: 'startup', label: '🚀 Startup (1-10)', emoji: '🚀' },
  { value: 'small', label: '🏪 Small (11-50)', emoji: '🏪' },
  { value: 'medium', label: '🏢 Medium (51-200)', emoji: '🏢' },
  { value: 'large', label: '🏛️ Large (201-1000)', emoji: '🏛️' },
  { value: 'enterprise', label: '🌐 Enterprise (1000+)', emoji: '🌐' },
]

export function AdvancedFilters({ filters, onChange, onClear, isMobile = false }: AdvancedFiltersProps) {
  const [salaryRange, setSalaryRange] = useState<[number, number]>([
    filters.salaryMin || 0,
    filters.salaryMax || 300000,
  ])

  const handleSalaryChange = (value: number[]) => {
    setSalaryRange([value[0], value[1]])
    onChange({
      ...filters,
      salaryMin: value[0] === 0 ? undefined : value[0],
      salaryMax: value[1] === 300000 ? undefined : value[1],
    })
  }

  const toggleCategory = (category: string) => {
    const categories = filters.categories || []
    const newCategories = categories.includes(category)
      ? categories.filter(c => c !== category)
      : [...categories, category]

    onChange({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : undefined,
    })
  }

  const toggleRemoteType = (type: string) => {
    const types = filters.remoteTypes || []
    const newTypes = types.includes(type)
      ? types.filter(t => t !== type)
      : [...types, type]

    onChange({
      ...filters,
      remoteTypes: newTypes.length > 0 ? newTypes : undefined,
    })
  }

  const toggleCompanySize = (size: string) => {
    const sizes = filters.companySizes || []
    const newSizes = sizes.includes(size)
      ? sizes.filter(s => s !== size)
      : [...sizes, size]

    onChange({
      ...filters,
      companySizes: newSizes.length > 0 ? newSizes : undefined,
    })
  }

  const activeFiltersCount =
    (filters.salaryMin || filters.salaryMax ? 1 : 0) +
    (filters.categories?.length || 0) +
    (filters.remoteTypes?.length || 0) +
    (filters.companySizes?.length || 0)

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Salary Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Salary Range</Label>
          <span className="text-sm text-muted-foreground">
            ${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
          </span>
        </div>
        <Slider
          min={0}
          max={300000}
          step={5000}
          value={salaryRange}
          onValueChange={handleSalaryChange}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>$300k+</span>
        </div>
      </div>

      {/* Categories */}
      <Collapsible defaultOpen>
        <div className="space-y-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <Label className="text-base font-semibold cursor-pointer">
              Categories
              {filters.categories && filters.categories.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.categories.length}
                </Badge>
              )}
            </Label>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            {CATEGORIES.map((cat) => (
              <div key={cat.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${cat.value}`}
                  checked={filters.categories?.includes(cat.value) || false}
                  onCheckedChange={() => toggleCategory(cat.value)}
                />
                <label
                  htmlFor={`cat-${cat.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {cat.label}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Remote Type */}
      <Collapsible defaultOpen>
        <div className="space-y-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <Label className="text-base font-semibold cursor-pointer">
              Remote Type
              {filters.remoteTypes && filters.remoteTypes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.remoteTypes.length}
                </Badge>
              )}
            </Label>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            {REMOTE_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`remote-${type.value}`}
                  checked={filters.remoteTypes?.includes(type.value) || false}
                  onCheckedChange={() => toggleRemoteType(type.value)}
                />
                <label
                  htmlFor={`remote-${type.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Company Size */}
      <Collapsible defaultOpen>
        <div className="space-y-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <Label className="text-base font-semibold cursor-pointer">
              Company Size
              {filters.companySizes && filters.companySizes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.companySizes.length}
                </Badge>
              )}
            </Label>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            {COMPANY_SIZES.map((size) => (
              <div key={size.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`size-${size.value}`}
                  checked={filters.companySizes?.includes(size.value) || false}
                  onCheckedChange={() => toggleCompanySize(size.value)}
                />
                <label
                  htmlFor={`size-${size.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {size.label}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          onClick={onClear}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Advanced Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  )

  // Mobile: Sheet (drawer)
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
            <SheetDescription>
              Refine your job search with advanced criteria
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: Collapsible panel
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 p-4 border rounded-lg bg-card">
        <FilterContent />
      </CollapsibleContent>
    </Collapsible>
  )
}
