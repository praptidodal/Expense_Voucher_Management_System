import { useState } from 'react'
import {
  FileText,
  Plus,
  Download,
  Trash2,
  DollarSign,
  Calendar,
  Building,
  Check,
  Search,
  AlertCircle,
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { SectionHeader } from '../components/layout/SectionHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { FormGroup } from '../components/ui/FormGroup'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'

export const DesignSystemPage = () => {
  const [sampleTitle, setSampleTitle] = useState('Client Hospitality Dinner')
  const [sampleDept, setSampleDept] = useState('Finance')
  const [sampleAmount, setSampleAmount] = useState('12500')
  const [sampleDate, setSampleDate] = useState('2026-10-10')
  const [sampleRemarks, setSampleRemarks] = useState('Travel expense for regional finance summit')

  return (
    <PageContainer>
      <SectionHeader
        title="Expense Desk UI Foundation"
        subtitle="Corporate design tokens, accessible form controls, and workflow status preview"
        badge={
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-subtle)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Design System Reference
          </span>
        }
        actions={
          <>
            <Button variant="secondary" icon={<Download size={16} />} title="Design system preview (action inactive)">
              Export Template (Preview)
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} title="Design system preview (action inactive)">
              Create Voucher (Preview)
            </Button>
          </>
        }
      />

      {/* Section 1: Design Tokens & Workflow Badges */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-4)', color: 'var(--color-deep-navy)' }}>
          Voucher Lifecycle & Status Badges
        </h2>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Workflow State Indicators</CardTitle>
              <CardDescription>
                Restrained badge indicators reflecting official voucher lifecycle stages (Draft, Pending, Approved, Rejected).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
              }}
            >
              <StatusBadge status="draft" />
              <StatusBadge status="submitted" />
              <StatusBadge status="approved" />
              <StatusBadge status="rejected" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Action Buttons */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-4)', color: 'var(--color-deep-navy)' }}>
          Button System & Interaction Hierarchy
        </h2>
        <div className="grid-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Standard Variants (Preview)</CardTitle>
                <CardDescription>Primary, secondary, destructive, and ghost styles (business actions inactive in Phase 1/2).</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Button variant="primary" icon={<Check size={16} />} title="Style preview only">
                  Approve
                </Button>
                <Button variant="secondary" icon={<FileText size={16} />} title="Style preview only">
                  Save Draft
                </Button>
                <Button variant="destructive" icon={<Trash2 size={16} />} title="Style preview only">
                  Reject
                </Button>
                <Button variant="ghost" title="Style preview only">Cancel</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Sizes & Disabled States (Preview)</CardTitle>
                <CardDescription>Scaled sizes for compact tables and disabled security states.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm" title="Style preview only">Small Action</Button>
                <Button variant="primary" size="md" title="Style preview only">Medium Action</Button>
                <Button variant="primary" size="lg" title="Style preview only">Large Action</Button>
                <Button variant="primary" disabled>Locked State</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 3: Form Controls & Inputs */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-4)', color: 'var(--color-deep-navy)' }}>
          Corporate Form Controls & Accessible Validations
        </h2>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Accessible Form Suite</CardTitle>
              <CardDescription>
                Inputs, selects, and textareas linked with labels, helper text, and accessible error attributes.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid-2">
              <FormGroup
                label="Expense Title"
                htmlFor="exp-title"
                required
                helperText="Provide a clear description of the expense."
              >
                <Input
                  id="exp-title"
                  value={sampleTitle}
                  onChange={(e) => setSampleTitle(e.target.value)}
                  placeholder="e.g. Regional Conference Travel"
                  leftIcon={<FileText size={16} />}
                  aria-describedby="exp-title-helper"
                />
              </FormGroup>

              <FormGroup label="Department Name" htmlFor="exp-dept" required>
                <Select
                  id="exp-dept"
                  value={sampleDept}
                  onChange={(e) => setSampleDept(e.target.value)}
                  options={[
                    { value: 'Finance', label: 'Finance & Accounts' },
                    { value: 'Engineering', label: 'Engineering' },
                    { value: 'Marketing', label: 'Marketing & Communications' },
                    { value: 'Operations', label: 'Operations & Logistics' },
                    { value: 'Executive', label: 'Executive Leadership' },
                  ]}
                />
              </FormGroup>
            </div>

            <div className="grid-3" style={{ marginTop: 'var(--space-2)' }}>
              <FormGroup label="Amount (INR)" htmlFor="exp-amount" required>
                <Input
                  id="exp-amount"
                  type="number"
                  value={sampleAmount}
                  onChange={(e) => setSampleAmount(e.target.value)}
                  leftIcon={<DollarSign size={16} />}
                />
              </FormGroup>

              <FormGroup label="Expense Date" htmlFor="exp-date" required>
                <Input
                  id="exp-date"
                  type="date"
                  value={sampleDate}
                  onChange={(e) => setSampleDate(e.target.value)}
                  leftIcon={<Calendar size={16} />}
                />
              </FormGroup>

              <FormGroup
                label="Search Voucher"
                htmlFor="exp-search"
                helperText="Search by voucher ID or employee (filter preview)"
              >
                <Input
                  id="exp-search"
                  placeholder="EV-20261010-001..."
                  leftIcon={<Search size={16} />}
                  aria-describedby="exp-search-helper"
                />
              </FormGroup>
            </div>

            <div style={{ marginTop: 'var(--space-2)' }}>
              <FormGroup label="Expense Description / Remarks" htmlFor="exp-desc">
                <Textarea
                  id="exp-desc"
                  value={sampleRemarks}
                  onChange={(e) => setSampleRemarks(e.target.value)}
                  rows={3}
                />
              </FormGroup>
            </div>

            <div style={{ marginTop: 'var(--space-2)' }}>
              <FormGroup
                label="Rejection Remark (Mandatory on Rejection — Error State Demonstration)"
                htmlFor="exp-err"
                required
                error="Rejection reason is required before rejecting a voucher."
              >
                <Input
                  id="exp-err"
                  hasError
                  defaultValue=""
                  placeholder="Enter reason for rejection..."
                  leftIcon={<AlertCircle size={16} />}
                  aria-describedby="exp-err-error"
                />
              </FormGroup>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 4: Reusable Card Pattern / Summary Preview */}
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: 'var(--space-4)', color: 'var(--color-deep-navy)' }}>
          Voucher Summary Card Pattern (UI Layout Preview)
        </h2>
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <CardTitle>Voucher EV-20261010-0042</CardTitle>
              <StatusBadge status="submitted" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-deep-navy)' }}>
              ₹ 12,500.00
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid-3">
              <div>
                <div className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Title
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px' }}>
                  {sampleTitle}
                </div>
              </div>

              <div>
                <div className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Department
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={14} style={{ color: 'var(--color-text-muted)' }} />
                  {sampleDept}
                </div>
              </div>

              <div>
                <div className="text-muted" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Expense Date
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-deep-navy)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                  {sampleDate}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm" title="Preview only (inactive)">
              View Full Audit (Preview)
            </Button>
            <Button variant="primary" size="sm" title="Preview only (inactive)">
              Review Voucher (Preview)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  )
}
