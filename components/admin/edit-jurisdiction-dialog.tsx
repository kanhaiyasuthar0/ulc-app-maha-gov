"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
});

interface Jurisdiction {
  id: string;
  name: string;
  subAdmins: string[];
  consumers: number;
  createdAt: string;
}

interface EditJurisdictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jurisdiction: Jurisdiction | null;
}

export function EditJurisdictionDialog({
  open,
  onOpenChange,
  jurisdiction,
}: EditJurisdictionDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when jurisdiction changes
  useEffect(() => {
    if (jurisdiction) {
      form.reset({
        name: jurisdiction.name,
      });
    }
  }, [jurisdiction, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!jurisdiction) return;

    setIsSubmitting(true);

    try {
      // In a real app, call your API
      const response = await fetch(
        `/api/admin/jurisdictions/${jurisdiction.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) throw new Error("Failed to update jurisdiction");

      toast.success("Jurisdiction has been updated successfully.");

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating jurisdiction:", error);
      toast.error("Failed to update jurisdiction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Jurisdiction</DialogTitle>
          <DialogDescription>Update jurisdiction details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jurisdiction Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
