/**
 * TSOAM Church Management System - Tithe Recording Component
 *
 * Quick tithe recording interface for church services
 * Integrates with member data and provides real-time search
 *
 * @author TSOAM Development Team
 * @version 1.0.0
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Search,
  Plus,
  Check,
  Clock,
  User,
  Calendar,
  CreditCard,
  Eye,
  Heart,
} from "lucide-react";
import { titheService, QuickTitheRecord } from "@/services/TitheService";
import { TitheRecord, FullMember } from "@/services/DatabaseService";
import { useAuth } from "@/contexts/AuthContext";

interface TitheRecordingProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMember?: FullMember | null;
}

export function TitheRecording({
  isOpen,
  onClose,
  selectedMember,
}: TitheRecordingProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberForTithe, setSelectedMemberForTithe] =
    useState<FullMember | null>(selectedMember || null);
  const [searchResults, setSearchResults] = useState<FullMember[]>([]);
  const [recentTithes, setRecentTithes] = useState<TitheRecord[]>([]);
  const [showMemberHistory, setShowMemberHistory] = useState(false);
  const [memberTithes, setMemberTithes] = useState<TitheRecord[]>([]);

  const [titheForm, setTitheForm] = useState({
    amount: "",
    paymentMethod: "Cash" as const,
    paymentReference: "",
    notes: "",
    category: "Tithe" as const,
    titheType: "Regular" as const,
  });

  useEffect(() => {
    if (selectedMember) {
      setSelectedMemberForTithe(selectedMember);
    }
    loadRecentTithes();
  }, [selectedMember]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const results = titheService.searchMembers(searchTerm);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadRecentTithes = () => {
    const recent = titheService.getRecentTithes(10);
    setRecentTithes(recent);
  };

  const handleMemberSelect = (member: FullMember) => {
    setSelectedMemberForTithe(member);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleTitheSubmit = () => {
    if (!selectedMemberForTithe || !user) {
      alert("Please select a member and ensure you are logged in.");
      return;
    }

    if (!titheForm.amount || parseFloat(titheForm.amount) <= 0) {
      alert("Please enter a valid tithe amount.");
      return;
    }

    const titheData: QuickTitheRecord = {
      memberId: selectedMemberForTithe.memberId,
      memberName: selectedMemberForTithe.fullName,
      titheNumber: selectedMemberForTithe.titheNumber,
      amount: parseFloat(titheForm.amount),
      paymentMethod: titheForm.paymentMethod,
      paymentReference: titheForm.paymentReference || undefined,
      notes: titheForm.notes || undefined,
      category: titheForm.category,
      titheType: titheForm.titheType,
    };

    try {
      const titheId = titheService.recordTithe(titheData, user.name);

      // Reset form
      setTitheForm({
        amount: "",
        paymentMethod: "Cash",
        paymentReference: "",
        notes: "",
        category: "Tithe",
        titheType: "Regular",
      });

      // Refresh recent tithes
      loadRecentTithes();

      alert(
        `Tithe recorded successfully!\nTithe ID: ${titheId.split("-")[2]}\nAmount: KSH ${titheData.amount.toLocaleString()}\nMember: ${titheData.memberName}`,
      );

      // Optionally close dialog
      // onClose();
    } catch (error) {
      alert("Failed to record tithe. Please try again.");
      console.error("Tithe recording error:", error);
    }
  };

  const handleViewMemberHistory = (member: FullMember) => {
    const history = titheService.getMemberTithes(member.memberId);
    setMemberTithes(history);
    setShowMemberHistory(true);
  };

  const resetForm = () => {
    setSelectedMemberForTithe(null);
    setSearchTerm("");
    setSearchResults([]);
    setTitheForm({
      amount: "",
      paymentMethod: "Cash",
      paymentReference: "",
      notes: "",
      category: "Tithe",
      titheType: "Regular",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Record Tithe
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Tithe Recording */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Record New Tithe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Member Selection */}
                <div className="space-y-2">
                  <Label>Select Member</Label>
                  {selectedMemberForTithe ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <div className="font-medium text-green-800">
                          {selectedMemberForTithe.fullName}
                        </div>
                        <div className="text-sm text-green-600">
                          {selectedMemberForTithe.memberId} •{" "}
                          {selectedMemberForTithe.titheNumber}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMemberForTithe(null)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, member ID, or tithe number..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {searchResults.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border rounded-md">
                          {searchResults.map((member) => (
                            <div
                              key={member.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              onClick={() => handleMemberSelect(member)}
                            >
                              <div className="font-medium">
                                {member.fullName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {member.memberId} • {member.titheNumber} •{" "}
                                {member.phoneNumber}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tithe Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (KSH) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={titheForm.amount}
                      onChange={(e) =>
                        setTitheForm({ ...titheForm, amount: e.target.value })
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <Select
                      value={titheForm.paymentMethod}
                      onValueChange={(value: any) =>
                        setTitheForm({ ...titheForm, paymentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                        <SelectItem value="Bank Transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Reference */}
                {titheForm.paymentMethod !== "Cash" && (
                  <div className="space-y-2">
                    <Label htmlFor="reference">Payment Reference</Label>
                    <Input
                      id="reference"
                      value={titheForm.paymentReference}
                      onChange={(e) =>
                        setTitheForm({
                          ...titheForm,
                          paymentReference: e.target.value,
                        })
                      }
                      placeholder="Transaction ID, Cheque number, etc."
                    />
                  </div>
                )}

                {/* Category and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={titheForm.category}
                      onValueChange={(value: any) =>
                        setTitheForm({ ...titheForm, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tithe">Tithe</SelectItem>
                        <SelectItem value="Offering">Offering</SelectItem>
                        <SelectItem value="Building Fund">
                          Building Fund
                        </SelectItem>
                        <SelectItem value="Mission">Mission</SelectItem>
                        <SelectItem value="Welfare">Welfare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={titheForm.titheType}
                      onValueChange={(value: any) =>
                        setTitheForm({ ...titheForm, titheType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="Special Offering">
                          Special Offering
                        </SelectItem>
                        <SelectItem value="Thanksgiving">
                          Thanksgiving
                        </SelectItem>
                        <SelectItem value="First Fruits">
                          First Fruits
                        </SelectItem>
                        <SelectItem value="Harvest">Harvest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={titheForm.notes}
                    onChange={(e) =>
                      setTitheForm({ ...titheForm, notes: e.target.value })
                    }
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleTitheSubmit}
                    disabled={!selectedMemberForTithe || !titheForm.amount}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Tithe
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Tithes */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Tithes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTithes.slice(0, 8).map((tithe) => (
                      <TableRow key={tithe.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {tithe.memberName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tithe.titheNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              KSH {tithe.amount.toLocaleString()}
                            </span>
                            {tithe.category !== "Tithe" && (
                              <Badge variant="outline" className="text-xs">
                                {tithe.category}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {tithe.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(tithe.titheDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {tithe.isVerified ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Member Tithe History Dialog */}
        <Dialog open={showMemberHistory} onOpenChange={setShowMemberHistory}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Member Tithe History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberTithes.map((tithe) => (
                    <TableRow key={tithe.id}>
                      <TableCell>
                        {new Date(tithe.titheDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>KSH {tithe.amount.toLocaleString()}</TableCell>
                      <TableCell>{tithe.paymentMethod}</TableCell>
                      <TableCell>{tithe.category}</TableCell>
                      <TableCell>
                        {tithe.isVerified ? (
                          <Badge className="bg-green-100 text-green-800">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
