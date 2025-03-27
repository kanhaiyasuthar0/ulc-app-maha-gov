"use client";

import { useEffect, useState } from "react";
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

// 1) Define schema for sub-admin creation
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  jurisdictions: z
    .array(z.string())
    .min(1, { message: "Select at least one jurisdiction" }),
});

interface AddSubAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Jurisdiction {
  _id: string;
  name: string;
  // Add other fields if your schema has them
}

export function AddSubAdminDialog({
  open,
  onOpenChange,
}: AddSubAdminDialogProps) {
  // 2) State to hold fetched jurisdictions
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [isLoadingJurisdictions, setIsLoadingJurisdictions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3) React Hook Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      jurisdictions: [],
    },
  });

  // 4) Fetch jurisdictions whenever the dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchJurisdictions = async () => {
      try {
        setIsLoadingJurisdictions(true);
        const response = await fetch("/api/admin/jurisdictions");
        if (!response.ok) {
          throw new Error("Failed to fetch jurisdictions");
        }
        const data: Jurisdiction[] = await response.json();
        setJurisdictions(data);
      } catch (error) {
        console.error("Error fetching jurisdictions:", error);
        toast.error("Could not load jurisdictions");
      } finally {
        setIsLoadingJurisdictions(false);
      }
    };

    fetchJurisdictions();
  }, [open]);

  // 5) Form submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      // In a real app, call your API
      const response = await fetch("/api/admin/sub-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to create sub-admin");

      toast.success("Sub-admin has been created successfully.");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating sub-admin:", error);
      toast.error("Failed to create sub-admin. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Sub Admin</DialogTitle>
          <DialogDescription>
            Create a new sub-admin account and assign jurisdictions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jurisdictions Field */}
            <FormField
              control={form.control}
              name="jurisdictions"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Jurisdictions</FormLabel>
                  </div>

                  {isLoadingJurisdictions ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Loading jurisdictions...
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {jurisdictions.map((jurisdiction) => (
                        <FormField
                          key={jurisdiction._id}
                          control={form.control}
                          name="jurisdictions"
                          render={({ field }) => {
                            const { value, onChange } = field;
                            const isChecked = value.includes(jurisdiction._id);

                            return (
                              <FormItem
                                key={jurisdiction._id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        onChange([...value, jurisdiction._id]);
                                      } else {
                                        onChange(
                                          value.filter(
                                            (val) => val !== jurisdiction._id
                                          )
                                        );
                                      }
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
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Sub Admin"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
