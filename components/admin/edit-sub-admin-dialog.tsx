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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  jurisdictions: z
    .array(z.string())
    .min(1, { message: "Select at least one jurisdiction" }),
});

interface SubAdmin {
  id: string;
  name: string;
  email: string;
  jurisdictions: string[];
}

interface EditSubAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subAdmin: SubAdmin | null;
}

export function EditSubAdminDialog({
  open,
  onOpenChange,
  subAdmin,
}: EditSubAdminDialogProps) {
  const [jurisdictions, setJurisdictions] = useState([
    { id: "1", name: "Mumbai" },
    { id: "2", name: "Pune" },
    { id: "3", name: "Thane" },
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      jurisdictions: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when subAdmin changes
  useEffect(() => {
    if (subAdmin) {
      form.reset({
        name: subAdmin.name,
        email: subAdmin.email,
        jurisdictions: subAdmin.jurisdictions,
      });
    }
  }, [subAdmin, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!subAdmin) return;

    setIsSubmitting(true);

    try {
      // In a real app, call your API
      const response = await fetch(`/api/admin/sub-admins/${subAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to update sub-admin");

      toast.success("Sub-admin has been updated successfully.");

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating sub-admin:", error);
      toast.error("Failed to update sub-admin. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Sub Admin</DialogTitle>
          <DialogDescription>
            Update sub-admin details and jurisdiction assignments.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jurisdictions"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Jurisdictions</FormLabel>
                  </div>
                  <div className="space-y-2">
                    {jurisdictions.map((jurisdiction) => (
                      <FormField
                        key={jurisdiction.id}
                        control={form.control}
                        name="jurisdictions"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={jurisdiction.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(
                                    jurisdiction.id
                                  )}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          jurisdiction.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== jurisdiction.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {jurisdiction.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
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
